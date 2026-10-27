import jwt from 'jsonwebtoken';
import { findById } from '../models/User.js';
import { env } from '../config/env.js';

const COOKIE_NAME = 'token';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// The login token lives in an httpOnly cookie: JavaScript on the page cannot read it,
// so an XSS bug cannot steal it. (localStorage would be readable by any script.)
export const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,        // https only in production
  sameSite: 'lax',           // not sent on cross-site POSTs
  path: '/',
};

export function issueToken(res, userId) {
  const token = jwt.sign({ id: userId }, env.jwtSecret, { algorithm: 'HS256', expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SEVEN_DAYS });
}

export function clearToken(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);
}

async function userFromRequest(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });   // pin the algorithm
    return await findById(payload.id);
  } catch {
    return null;
  }
}

/** Route needs a logged-in user. */
export async function protect(req, res, next) {
  const user = await userFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Please log in to continue.' });
  req.user = user;
  next();
}

/** Route works for everyone, but knows who you are if you are logged in. */
export async function optionalAuth(req, _res, next) {
  req.user = await userFromRequest(req);
  next();
}

/** Use after protect(). Role comes from the database, never from the request. */
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admins only.' });
  next();
}
