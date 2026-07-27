import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { serializeSettings, updateSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { votingStartsAt, votingEndsAt } = (body ?? {}) as {
    votingStartsAt?: string;
    votingEndsAt?: string;
  };

  const start = votingStartsAt ? new Date(votingStartsAt) : null;
  const end = votingEndsAt ? new Date(votingEndsAt) : null;

  if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "votingStartsAt and votingEndsAt must be valid dates." }, { status: 400 });
  }
  if (end <= start) {
    return NextResponse.json({ error: "votingEndsAt must be after votingStartsAt." }, { status: 400 });
  }

  const settings = await updateSettings({ votingStartsAt: start, votingEndsAt: end });
  return NextResponse.json({ settings: serializeSettings(settings) });
}
