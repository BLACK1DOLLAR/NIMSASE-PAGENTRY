import mongoose from "mongoose";

/** Bucket name -> backs the `contestantPhotos.files` / `.chunks` collections. */
const BUCKET_NAME = "contestantPhotos";

/**
 * Must be called after connectToDatabase() so mongoose.connection.db is
 * ready. Uses mongoose's own bundled `mongodb` driver (mongoose.mongo)
 * rather than importing the top-level `mongodb` package directly — mongoose
 * pins its own driver version internally, and mixing the two produces two
 * structurally-identical-but-nominally-different `Db`/`GridFSBucket` types
 * that TypeScript (correctly) refuses to treat as interchangeable.
 */
export function getPhotoBucket() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection is not ready.");
  }
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
}
