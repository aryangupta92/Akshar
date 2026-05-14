import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  preferredLanguage: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name:              { type: String, required: true, trim: true, maxlength: 100 },
    email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:      { type: String, required: true },
    preferredLanguage: { type: String, default: 'hi', enum: ['hi','en','ta','te','mr','bn','gu','pa'] },
    avatar:            { type: String },
    bio:               { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);
