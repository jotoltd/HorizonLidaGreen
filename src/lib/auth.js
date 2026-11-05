import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase";

export const JWT_SECRET =
  process.env.JWT_SECRET || "hlg-platform-dev-secret-change-in-production";

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((c) => {
    const [key, ...val] = c.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(val.join("="));
  });
  return cookies;
}

export function getTokenFromRequest(req) {
  const cookies = parseCookies(req.headers.get?.("cookie") || req.headers.cookie || "");
  return cookies.token ? verifyToken(cookies.token) : null;
}

// Re-read the user row so role/profile changes (e.g. admin promoting a
// client) take effect immediately instead of waiting for the JWT to expire.
export async function resolveUser(tokenUser) {
  if (!tokenUser?.id) return null;
  const { data: user } = await supabase
    .from("User")
    .select("id, email, name, role")
    .eq("id", tokenUser.id)
    .maybeSingle();
  if (!user) return null;
  return { ...tokenUser, ...user };
}

export async function getAuthUser(req) {
  const tokenUser = getTokenFromRequest(req);
  return tokenUser ? resolveUser(tokenUser) : null;
}
