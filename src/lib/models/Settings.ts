import mongoose, { Schema, type Document, type Model } from "mongoose";

/**
 * Singleton document holding the voting window. There is only ever one of
 * these; helpers in src/lib/settings.ts enforce that and provide defaults.
 */
export interface SettingsDocument extends Document {
  votingStartsAt: Date;
  votingEndsAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<SettingsDocument>({
  votingStartsAt: { type: Date, required: true },
  votingEndsAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true, default: () => new Date() },
});

export const Settings: Model<SettingsDocument> =
  mongoose.models.Settings || mongoose.model<SettingsDocument>("Settings", SettingsSchema);
