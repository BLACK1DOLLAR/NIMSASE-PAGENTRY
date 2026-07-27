import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Contestant } from "@/lib/models/Contestant";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { serializeContestant } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  await connectToDatabase();
  const contestants = await Contestant.find().sort({ name: 1 });
  return NextResponse.json({ contestants: contestants.map(serializeContestant) });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, photoUrl, bio, msaChapter } = (body ?? {}) as {
    name?: string;
    photoUrl?: string;
    bio?: string;
    msaChapter?: string;
  };
  if (!name?.trim() || !photoUrl?.trim() || !bio?.trim() || !msaChapter?.trim()) {
    return NextResponse.json({ error: "name, photoUrl, bio and msaChapter are all required." }, { status: 400 });
  }

  await connectToDatabase();
  const contestant = await Contestant.create({
    name: name.trim(),
    photoUrl: photoUrl.trim(),
    bio: bio.trim(),
    msaChapter: msaChapter.trim(),
    voteCount: 0,
  });

  return NextResponse.json({ contestant: serializeContestant(contestant) }, { status: 201 });
}
