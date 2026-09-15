import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
