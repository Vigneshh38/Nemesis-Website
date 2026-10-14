import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { adminEmails } from "./services";

export type Viewer = {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  isAdmin: boolean;
};

export async function getViewer(): Promise<Viewer | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  if (!user) return null;
  const email = (user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "").toLowerCase();
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || email.split("@")[0] || "Agent";
  return {
    id: userId,
    name,
    email,
    imageUrl: user.imageUrl,
    isAdmin: Boolean(email) && adminEmails().includes(email),
  };
}

export async function baseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
