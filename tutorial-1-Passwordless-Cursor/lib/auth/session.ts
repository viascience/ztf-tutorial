import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { SessionData } from "@/types/auth";

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "via_ztf_session",
  cookieOptions: {
    // For OAuth cross-site redirects, we need sameSite: "none"
    // In development (HTTP), browser may not enforce this strictly
    // In production, must use HTTPS with secure: true
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    // Use "none" for cross-site OAuth, "lax" blocks cookies from Keycloak redirect
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getServerSession(): Promise<SessionData | null> {
  const session = await getSession();
  if (!session.userId) {
    return null;
  }
  return session as SessionData;
}

export async function createSession(data: SessionData): Promise<void> {
  const session = await getSession();
  Object.assign(session, data);
  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

