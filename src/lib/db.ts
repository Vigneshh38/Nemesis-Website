import "server-only";
import dns from "node:dns";
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
    const options = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      dbName: process.env.MONGODB_DB || undefined,
    };
    cache.promise = mongoose
      .connect(uri, options)
      .catch(async (err: NodeJS.ErrnoException) => {
        // Some Windows/router DNS setups refuse SRV lookups from Node. Retry once via public resolvers.
        if (uri.startsWith("mongodb+srv://") && /querySrv/.test(err.message)) {
          dns.setServers(["1.1.1.1", "8.8.8.8"]);
          return mongoose.connect(uri, options);
        }
        throw err;
      })
      .catch((err) => {
        cache.promise = null;
        throw err;
      });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
