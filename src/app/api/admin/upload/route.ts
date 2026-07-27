import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { connectToDatabase } from "@/lib/db";
import { getPhotoBucket } from "@/lib/gridfs";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { MAX_PHOTO_UPLOAD_BYTES } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
  }

  if (file.size > MAX_PHOTO_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Image is too large. Max size is ${Math.round(MAX_PHOTO_UPLOAD_BYTES / (1024 * 1024))}MB.` },
      { status: 400 },
    );
  }

  await connectToDatabase();
  const bucket = getPhotoBucket();
  const originalName = file instanceof File ? file.name : "photo";
  const buffer = Buffer.from(await file.arrayBuffer());

  const fileId = await new Promise<string>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(originalName, {
      metadata: { contentType: file.type },
    });
    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id.toString()));
    Readable.from(buffer).pipe(uploadStream);
  });

  return NextResponse.json({ url: `/api/images/${fileId}` }, { status: 201 });
}
