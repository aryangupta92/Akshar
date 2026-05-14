import mongoose, { Schema, Document } from 'mongoose';

export interface IUserBookmark extends Document {
  userId:     mongoose.Types.ObjectId;
  contentId:  mongoose.Types.ObjectId;
  createdAt:  Date;
}

const userBookmarkSchema = new Schema<IUserBookmark>(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Composite unique — one bookmark per user per content
userBookmarkSchema.index({ userId: 1, contentId: 1 }, { unique: true });
// Lookup: "all bookmarks by user"
userBookmarkSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.UserBookmark ||
  mongoose.model<IUserBookmark>('UserBookmark', userBookmarkSchema);
