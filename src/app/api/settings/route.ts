import { NextResponse } from "next/server";
import { getSettings, serializeSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Public: current voting window, used to drive the countdown + vote gating. */
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings: serializeSettings(settings) });
}
