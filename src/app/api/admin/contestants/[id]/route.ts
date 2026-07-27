import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Contestant } from "@/lib/models/Contestant";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { serializeContestant } from "@/lib/serialize";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid contestant id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, photoUrl, bio, msaChapter, resetVotes } = (body ?? {}) as {
    name?: string;
    photoUrl?: string;
    bio?: string;
    msaChapter?: string;
    resetVotes?: boolean;
  };

  await connectToDatabase();
  const contestant = await Contestant.findById(params.id);
  if (!contestant) {
    return NextResponse.json({ error: "Contestant not found." }, { status: 404 });
  }

  if (typeof name === "string" && name.trim()) contestant.name = name.trim();
  if (typeof photoUrl === "string" && photoUrl.trim()) contestant.photoUrl = photoUrl.trim();
  if (typeof bio === "string" && bio.trim()) contestant.bio = bio.trim();
  if (typeof msaChapter === "string" && msaChapter.trim()) contestant.msaChapter = msaChapter.trim();
  if (resetVotes === true) contestant.voteCount = 0;

  await contestant.save();
  return NextResponse.json({ contestant: serializeContestant(contestant) });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid contestant id." }, { status: 400 });
  }

  await connectToDatabase();
  const deleted = await Contestant.findByIdAndDelete(params.id);
  if (!deleted) {
    return NextResponse.json({ error: "Contestant not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
