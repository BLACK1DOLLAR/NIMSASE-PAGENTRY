export interface ContestantDTO {
  id: string;
  name: string;
  photoUrl: string;
  bio: string;
  msaChapter: string | null;
  voteCount: number;
  createdAt: string;
}

export type TransactionStatus = "pending" | "success" | "failed";

export interface TransactionDTO {
  reference: string;
  contestantId: string;
  amountPaid: number; // kobo
  votesCredited: number;
  status: TransactionStatus;
  createdAt: string;
}

export interface VotingSettingsDTO {
  votingStartsAt: string;
  votingEndsAt: string;
}
