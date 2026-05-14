import { Request, Response } from 'express';
import Content from '../models/Content';

export const searchContent = async (req: Request, res: Response) => {
  try {
    const { q, genre, language } = req.query as Record<string, string>;

    const query: Record<string, unknown> = { isPublished: true };

    // Use MongoDB $text index (defined on title, genre, tags, language)
    // Falls back to regex-free filter if no q provided
    if (q && q.trim()) {
      query.$text = { $search: q.trim() };
    }

    if (genre && genre !== 'all') query.genre = genre;
    if (language && language !== 'all') query.language = language;

    const results = await Content.find(
      query,
      q ? { score: { $meta: 'textScore' } } : {} // include relevance score when searching
    )
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .populate('authorId', 'name avatar')
      .limit(20)
      .select('-versions -currentDelta');

    res.json({ results });
  } catch (err) {
    console.error('[searchContent]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
