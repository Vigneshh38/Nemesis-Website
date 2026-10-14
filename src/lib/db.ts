import "server-only";
import mongoose from "mongoose";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalForMongoose = globalThis as unknown as { __nemesisMongoose?: Cache };
const cache: Cache = globalForMongoose.__nemesisMongoose ?? { conn: null, promise: null };
globalForMongoose.__nemesisMongoose = cache;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("MONGODB_URI is not set");
    this.name = "DatabaseNotConfiguredError";
  }
}

export function isDbConfigured() {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DatabaseNotConfiguredError();
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
        dbName: process.env.MONGODB_DB || undefined,
      })
      .catch((err) => {
        cache.promise = null;
        throw err;
      });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
