/**
 * Seeds 6 placeholder contestants and a default voting window.
 * Run with: npm run seed
 *
 * Safe to re-run: it only inserts contestants if the collection is empty,
 * and only creates Settings if none exists yet. Replace the placeholder
 * names/photos/bios with your real contestants any time from /admin, or by
 * editing this file before the first run.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { Contestant } from "../src/lib/models/Contestant";
import { Settings } from "../src/lib/models/Settings";

const PLACEHOLDER_CONTESTANTS = [
  {
    name: "Chidinma Okafor",
    photoUrl: "https://picsum.photos/seed/nimsa-chidinma/600/750",
    bio: "A final-year Medicine student and advocate for maternal health outreach across the South East.",
    msaChapter: "UNN MSA",
  },
  {
    name: "Ngozi Eze",
    photoUrl: "https://picsum.photos/seed/nimsa-ngozi/600/750",
    bio: "Passionate about community health education, with a heart for rural clinic volunteering.",
    msaChapter: "UNIZIK MSA",
  },
  {
    name: "Adaeze Nwosu",
    photoUrl: "https://picsum.photos/seed/nimsa-adaeze/600/750",
    bio: "Champions mental health awareness among students and young medical professionals.",
    msaChapter: "ESUT MSA",
  },
  {
    name: "Ifeoma Chukwu",
    photoUrl: "https://picsum.photos/seed/nimsa-ifeoma/600/750",
    bio: "A gifted vocalist and public health enthusiast blending culture with community care.",
    msaChapter: "IMSU MSA",
  },
  {
    name: "Chiamaka Obi",
    photoUrl: "https://picsum.photos/seed/nimsa-chiamaka/600/750",
    bio: "Dedicated to bridging the gap between traditional and modern healthcare practices.",
    msaChapter: "ABSU MSA",
  },
  {
    name: "Amarachi Umeh",
    photoUrl: "https://picsum.photos/seed/nimsa-amarachi/600/750",
    bio: "An advocate for adolescent reproductive health with a warm, magnetic stage presence.",
    msaChapter: "EBSU MSA",
  },
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.local.example to .env.local and fill it in first.");
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const existingCount = await Contestant.countDocuments();
  if (existingCount > 0) {
    console.log(`Contestants collection already has ${existingCount} document(s) — skipping contestant seed.`);
  } else {
    await Contestant.insertMany(PLACEHOLDER_CONTESTANTS.map((c) => ({ ...c, voteCount: 0 })));
    console.log(`Inserted ${PLACEHOLDER_CONTESTANTS.length} placeholder contestants.`);
  }

  const existingSettings = await Settings.findOne();
  if (existingSettings) {
    console.log("Settings document already exists — leaving voting window untouched.");
  } else {
    const now = new Date();
    const votingStartsAt = process.env.VOTING_STARTS_AT ? new Date(process.env.VOTING_STARTS_AT) : now;
    const votingEndsAt = process.env.VOTING_ENDS_AT
      ? new Date(process.env.VOTING_ENDS_AT)
      : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    await Settings.create({ votingStartsAt, votingEndsAt, updatedAt: now });
    console.log(`Created voting window: ${votingStartsAt.toISOString()} -> ${votingEndsAt.toISOString()}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
