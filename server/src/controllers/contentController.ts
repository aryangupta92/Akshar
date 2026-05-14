import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Content from '../models/Content';
import ArchivedVersion from '../models/ArchivedVersion';
import UserBookmark from '../models/UserBookmark';
import redis from '../utils/redis';
import { archiveQueue } from '../utils/archiveQueue';

// ── Helper: get bookmark count from Redis (write-through cache) ──
async function getBookmarkCount(contentId: string): Promise<number> {
  try {
    const key = `bookmark:count:${contentId}`;
    const cached = await redis.get(key);
    if (cached !== null) return parseInt(cached, 10);
    // Cache miss — read from DB and prime the cache
    const doc = await Content.findById(contentId, 'bookmarkCount');
    const count = doc?.bookmarkCount ?? 0;
    await redis.set(key, count, 'EX', 3600); // 1hr TTL
    return count;
  } catch {
    // Redis unavailable — fall back to DB value
    const doc = await Content.findById(contentId, 'bookmarkCount');
    return doc?.bookmarkCount ?? 0;
  }
}

// ── Browse (public) ────────────────────────────────────────────
export const getContents = async (req: Request, res: Response) => {
  try {
    const { language, genre, sort, page = '1', limit = '12' } = req.query as Record<string, string>;
    const query: Record<string, unknown> = { isPublished: true };
    if (language && language !== 'all') query.language = language;
    if (genre && genre !== 'all') query.genre = genre;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [contents, total] = await Promise.all([
      Content.find(query)
        .sort(sort === 'popular' ? { bookmarkCount: -1 } : { createdAt: -1 })
        .populate('authorId', 'name avatar')
        .skip(skip)
        .limit(limitNum)
        .select('-versions -currentDelta'), // exclude heavy fields from list view
      Content.countDocuments(query),
    ]);

    res.json({
      contents,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[getContents]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Create new content ─────────────────────────────────────────
export const createContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, genre, language, tags } = req.body;

    if (!title || !genre || !language) {
      return res.status(400).json({ error: 'title, genre and language are required' });
    }

    const content = await Content.create({
      title: title.trim(),
      genre,
      language,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim().toLowerCase()) : [],
      authorId: new mongoose.Types.ObjectId(user.userId),
      currentDelta: { ops: [{ insert: '\n' }] }, // empty Quill delta
      versions: [],
      bookmarkCount: 0,
      isPublished: false, // draft by default
    });

    res.status(201).json({ content });
  } catch (err) {
    console.error('[createContent]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── My works ───────────────────────────────────────────────────
export const getMyContents = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const contents = await Content.find({ authorId: user.userId })
      .sort({ updatedAt: -1 })
      .select('-versions -currentDelta'); // list view — no heavy fields
    res.json({ contents });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Get single content (with versions for author) ──────────────
export const getContentById = async (req: Request, res: Response) => {
  try {
    const content = await Content.findById(req.params.id).populate('authorId', 'name avatar bio');
    if (!content) return res.status(404).json({ error: 'Not found' });

    // Serve bookmarkCount from Redis (read-heavy, always from cache)
    const bookmarkCount = await getBookmarkCount(req.params.id as string);

    res.json({ content: { ...content.toObject(), bookmarkCount } });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Update metadata (title, genre, tags, isPublished) ─────────
export const updateContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: 'Not found' });
    if (content.authorId.toString() !== user.userId) return res.status(403).json({ error: 'Forbidden' });

    const allowed = ['title', 'genre', 'language', 'tags', 'isPublished'] as const;
    for (const key of allowed) {
      if (req.body[key] !== undefined) (content as any)[key] = req.body[key];
    }

    await content.save();
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Delete ─────────────────────────────────────────────────────
export const deleteContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: 'Not found' });
    if (content.authorId.toString() !== user.userId) return res.status(403).json({ error: 'Forbidden' });

    await Promise.all([
      Content.findByIdAndDelete(req.params.id),
      ArchivedVersion.deleteMany({ contentId: req.params.id }),
      UserBookmark.deleteMany({ contentId: req.params.id }),
      redis.del(`bookmark:count:${req.params.id}`),
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Save delta (version-controlled) ───────────────────────────
// This is the core business logic:
//   1. Push a new embedded version snapshot
//   2. If embedded versions > 50, pop oldest → send to archiveQueue
//   3. Update currentDelta
export const saveContentDelta = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { delta } = req.body;

    if (!delta || !delta.ops) {
      return res.status(400).json({ error: 'delta with ops array is required' });
    }

    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: 'Not found' });
    if (content.authorId.toString() !== user.userId) return res.status(403).json({ error: 'Forbidden' });

    // Create new version snapshot
    const newVersion = {
      versionId: new mongoose.Types.ObjectId().toString(),
      delta: content.currentDelta ?? { ops: [{ insert: '\n' }] }, // snapshot of PREVIOUS state
      editedAt: new Date(),
    };

    content.versions.push(newVersion);

    // If over 50, archive the oldest and remove from embedded array
    if (content.versions.length > 50) {
      const oldest = content.versions.shift()!;
      if (archiveQueue) {
        await archiveQueue.add('archive-version', {
          contentId: content._id.toString(),
          versionId: oldest.versionId,
          delta: oldest.delta,
          editedAt: oldest.editedAt,
        });
      }
    }

    // Update the current (live) delta
    content.currentDelta = delta;
    await content.save();

    res.json({ success: true, versionCount: content.versions.length });
  } catch (err) {
    console.error('[saveContentDelta]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Get version history ────────────────────────────────────────
export const getContentVersions = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const content = await Content.findById(req.params.id).select('authorId versions');
    if (!content) return res.status(404).json({ error: 'Not found' });
    if (content.authorId.toString() !== user.userId) return res.status(403).json({ error: 'Forbidden' });

    // Also fetch archived versions (those pushed out when > 50)
    const archived = await ArchivedVersion.find({ contentId: req.params.id })
      .sort({ editedAt: -1 })
      .select('-__v');

    res.json({
      embedded: [...content.versions].reverse(), // most recent first
      archived,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Toggle bookmark (Redis write-through) ─────────────────────
export const toggleBookmark = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const contentId = req.params.id;
    const redisKey = `bookmark:count:${contentId}`;

    const existing = await UserBookmark.findOne({ userId: user.userId, contentId });

    let bookmarked: boolean;
    let count: number;

    if (existing) {
      // Remove bookmark
      await Promise.all([
        UserBookmark.findByIdAndDelete(existing._id),
        Content.findByIdAndUpdate(contentId, { $inc: { bookmarkCount: -1 } }),
        redis.decr(redisKey), // write-through: update cache immediately
      ]);
      bookmarked = false;
    } else {
      // Add bookmark
      await Promise.all([
        UserBookmark.create({ userId: user.userId, contentId }),
        Content.findByIdAndUpdate(contentId, { $inc: { bookmarkCount: 1 } }),
        redis.incr(redisKey), // write-through: update cache immediately
      ]);
      bookmarked = true;
    }

    // Set expiry on the key (in case it was just created)
    await redis.expire(redisKey, 3600);
    const cached = await redis.get(redisKey);
    count = cached !== null ? parseInt(cached, 10) : 0;

    res.json({ bookmarked, count });
  } catch (err) {
    console.error('[toggleBookmark]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Rate content ───────────────────────────────────────────────
export const rateContent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { value } = req.body;
    const rating = parseInt(value, 10);

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: 'Not found' });

    const userId = new mongoose.Types.ObjectId(user.userId);
    const existingIndex = content.ratings.findIndex(
      (r: { userId: { toString(): string } }) => r.userId.toString() === user.userId
    );

    if (existingIndex >= 0) {
      content.ratings[existingIndex].value = rating;
    } else {
      content.ratings.push({ userId, value: rating });
    }

    await content.save();

    const avg = content.ratings.reduce((sum: number, r: { value: number }) => sum + r.value, 0) / content.ratings.length;
    res.json({ avgRating: Math.round(avg * 10) / 10, count: content.ratings.length });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
