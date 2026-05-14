import mongoose, { Schema, Document } from 'mongoose';

// ── Sub-document: one embedded version snapshot ───────────────
export interface IVersion {
  versionId: string;           // UUID-like string
  delta:     Record<string, unknown>; // Quill Delta JSON
  editedAt:  Date;
}

// ── Sub-document: one star rating ────────────────────────────
export interface IRating {
  userId: mongoose.Types.ObjectId;
  value:  number; // 1-5
}

// ── Main document ─────────────────────────────────────────────
export interface IContent extends Document {
  title:        string;
  genre:        'lyrics' | 'story' | 'poem' | 'screenplay';
  language:     string;
  tags:         string[];
  authorId:     mongoose.Types.ObjectId;

  // Quill Delta storage (spec: store delta, not HTML)
  currentDelta: Record<string, unknown>;

  // Embedded version history — capped at 50 (spec requirement)
  versions:     IVersion[];

  // Denormalised counters (fast reads, Redis-backed for bookmarks)
  bookmarkCount: number;
  ratings:       IRating[];

  isPublished: boolean;
  createdAt:   Date;
  updatedAt:   Date;
}

// ── Version sub-schema ────────────────────────────────────────
const versionSchema = new Schema<IVersion>(
  {
    versionId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    delta:     { type: mongoose.Schema.Types.Mixed, required: true },
    editedAt:  { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Rating sub-schema ─────────────────────────────────────────
const ratingSchema = new Schema<IRating>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    value:  { type: Number, min: 1, max: 5, required: true },
  },
  { _id: false }
);

// ── Content schema ────────────────────────────────────────────
const contentSchema = new Schema<IContent>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    genre: {
      type: String,
      enum: ['lyrics', 'story', 'poem', 'screenplay'],
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['hi', 'en', 'ta', 'te', 'mr', 'bn', 'gu', 'pa'],
      default: 'hi',
    },
    tags: {
      type: [String],
      default: [],
      // Normalise: lowercase, deduplicate
      set: (v: string[]) => [...new Set(v.map((t) => t.toLowerCase().trim()))],
    },
    authorId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    currentDelta: { type: mongoose.Schema.Types.Mixed, default: { ops: [{ insert: '\n' }] } },
    versions: {
      type: [versionSchema],
      default: [],
      // Enforced in controller (not validator) to allow archival logic
    },
    bookmarkCount: { type: Number, default: 0, min: 0 },
    ratings:       { type: [ratingSchema], default: [] },
    isPublished:   { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    // i18n — Devanagari collation for correct Hindi/Marathi sort order
    collation: { locale: 'hi', strength: 2 },
  }
);

// ── Indexes ───────────────────────────────────────────────────

// Full-text search across title, tags, language, genre (spec requirement)
// default_language: 'none' so MongoDB doesn't apply English stemming to Indian text
contentSchema.index(
  { title: 'text', tags: 'text', language: 'text', genre: 'text' },
  { default_language: 'none', name: 'content_fts', weights: { title: 10, tags: 5, genre: 2, language: 1 } }
);

// Browse queries
contentSchema.index({ isPublished: 1, createdAt: -1 });
contentSchema.index({ isPublished: 1, bookmarkCount: -1 });
contentSchema.index({ genre: 1, language: 1, isPublished: 1 });

// Virtual: computed average rating (not stored — derived on the fly)
contentSchema.virtual('avgRating').get(function (this: IContent) {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, r) => acc + r.value, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

contentSchema.set('toObject', { virtuals: true });
contentSchema.set('toJSON',   { virtuals: true });

export default mongoose.models.Content || mongoose.model<IContent>('Content', contentSchema);
