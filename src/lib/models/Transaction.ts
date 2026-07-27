import mongoose, { Schema, type Document, type Model } from "mongoose";

export type TransactionStatus = "pending" | "success" | "failed";

export interface TransactionDocument extends Document {
  reference: string;
  contestantId: mongoose.Types.ObjectId;
  amountPaid: number; // kobo, per Paystack convention
  votesCredited: number;
  status: TransactionStatus;
  customerEmail?: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<TransactionDocument>({
  // Paystack transaction reference. Unique + indexed: this is the field the
  // webhook uses to guarantee idempotent crediting (see /api/paystack/webhook).
  reference: { type: String, required: true, unique: true, index: true },
  contestantId: { type: Schema.Types.ObjectId, required: true, ref: "Contestant" },
  amountPaid: { type: Number, required: true, min: 0 },
  votesCredited: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    required: true,
    enum: ["pending", "success", "failed"],
    default: "pending",
    index: true,
  },
  customerEmail: { type: String },
  createdAt: { type: Date, required: true, default: () => new Date() },
});

export const Transaction: Model<TransactionDocument> =
  mongoose.models.Transaction || mongoose.model<TransactionDocument>("Transaction", TransactionSchema);
