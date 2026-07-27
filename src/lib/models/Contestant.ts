import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ContestantDocument extends Document {
  name: string;
  photoUrl: string;
  bio: string;
  /** The MSA (Medical Students' Association) chapter/school this contestant represents, e.g. "UNN MSA". */
  msaChapter?: string;
  voteCount: number;
  createdAt: Date;
}

const ContestantSchema = new Schema<ContestantDocument>({
  name: { type: String, required: true, trim: true },
  photoUrl: { type: String, required: true },
  bio: { type: String, required: true, trim: true },
  // Optional at the schema level (not `required`) so contestants created
  // before this field existed don't fail validation on save.
  msaChapter: { type: String, trim: true },
  voteCount: { type: Number, required: true, default: 0, min: 0 },
  createdAt: { type: Date, required: true, default: () => new Date() },
});

// Mongoose caches models on `mongoose.models` across hot-reloads / warm
// serverless invocations, so re-registering the same model doesn't throw.
export const Contestant: Model<ContestantDocument> =
  mongoose.models.Contestant || mongoose.model<ContestantDocument>("Contestant", ContestantSchema);
