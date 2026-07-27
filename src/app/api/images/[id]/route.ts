import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getPhotoBucket } from "@/lib/gridfs";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid image id." }, { status: 400 });
  }

  await connectToDatabase();
  const bucket = getPhotoBucket();
  const fileId = new mongoose.mongo.ObjectId(params.id);

  const [file] = await bucket.find({ _id: fileId }).toArray();
  if (!file) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const nodeStream = bucket.openDownloadStream(fileId);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  const contentType = (file.metadata as { contentType?: string } | undefined)?.contentType ?? "application/octet-stream";

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(file.length),
      // Uploads are content-addressed by a fresh ObjectId each time, so the
      // bytes at this URL never change — safe to cache aggressively.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
