import mongoose, { Schema, Document } from 'mongoose';

// Archived versions — pushed here via BullMQ worker when embedded versions exceed 50
export interface IArchivedVersion extends Document {
  contentId:  mongoose.Types.ObjectId;
  versionId:  string;
  delta:      Record<string, unknown>; // Quill Delta JSON
  editedAt:   Date;
  archivedAt: Date;
}

const archivedVersionSchema = new Schema<IArchivedVersion>(
  {
    contentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
    versionId:  { type: String, required: true },
    delta:      { type: mongoose.Schema.Types.Mixed, required: true },
    editedAt:   { type: Date, required: true },
    archivedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Fast lookup by content and chronological order
archivedVersionSchema.index({ contentId: 1, editedAt: -1 });

export default mongoose.models.ArchivedVersion ||
  mongoose.model<IArchivedVersion>('ArchivedVersion', archivedVersionSchema);
