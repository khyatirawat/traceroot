import type { SessionOptions } from "iron-session";
export interface AppSession { userId?: string; email?: string; name?: string; }
const password = process.env.SESSION_SECRET ?? "";
if (password.length > 0 && password.length < 16) console.warn("[session] SESSION_SECRET is short.");
export const sessionOptions: SessionOptions = { password: password || "traceroot-dev-only-secret-change-me-now-please-32chars", cookieName: "traceroot_session", cookieOptions: { secure: process.env.NODE_ENV === "production", sameSite: "lax", httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 14 } };
