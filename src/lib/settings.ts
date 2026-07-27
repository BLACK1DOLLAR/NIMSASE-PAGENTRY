import { connectToDatabase } from "@/lib/db";
import { Settings, type SettingsDocument } from "@/lib/models/Settings";
import type { VotingSettingsDTO } from "@/types";

/**
 * Voting window is stored in the DB (singleton document) so organizers can
 * change it from /admin without a redeploy, per the spec. If no document
 * exists yet (fresh install, seed script not run), fall back to env vars,
 * and finally to "starts now, ends in 14 days" so the app never crashes.
 */
export async function getSettings(): Promise<SettingsDocument> {
  await connectToDatabase();
  const existing = await Settings.findOne();
  if (existing) return existing;

  const now = new Date();
  const fallbackStart = process.env.VOTING_STARTS_AT ? new Date(process.env.VOTING_STARTS_AT) : now;
  const fallbackEnd = process.env.VOTING_ENDS_AT
    ? new Date(process.env.VOTING_ENDS_AT)
    : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  return Settings.create({
    votingStartsAt: fallbackStart,
    votingEndsAt: fallbackEnd,
    updatedAt: now,
  });
}

export function serializeSettings(doc: SettingsDocument): VotingSettingsDTO {
  return {
    votingStartsAt: doc.votingStartsAt.toISOString(),
    votingEndsAt: doc.votingEndsAt.toISOString(),
  };
}

export async function updateSettings(input: { votingStartsAt: Date; votingEndsAt: Date }): Promise<SettingsDocument> {
  await connectToDatabase();
  const existing = await Settings.findOne();
  if (existing) {
    existing.votingStartsAt = input.votingStartsAt;
    existing.votingEndsAt = input.votingEndsAt;
    existing.updatedAt = new Date();
    await existing.save();
    return existing;
  }
  return Settings.create({
    votingStartsAt: input.votingStartsAt,
    votingEndsAt: input.votingEndsAt,
    updatedAt: new Date(),
  });
}
