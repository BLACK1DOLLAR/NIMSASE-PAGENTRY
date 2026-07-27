import type { ContestantDocument } from "@/lib/models/Contestant";
import type { TransactionDocument } from "@/lib/models/Transaction";
import type { ContestantDTO, TransactionDTO } from "@/types";

export function serializeContestant(doc: ContestantDocument): ContestantDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    photoUrl: doc.photoUrl,
    bio: doc.bio,
    voteCount: doc.voteCount,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function serializeTransaction(doc: TransactionDocument): TransactionDTO {
  return {
    reference: doc.reference,
    contestantId: doc.contestantId.toString(),
    amountPaid: doc.amountPaid,
    votesCredited: doc.votesCredited,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
}
