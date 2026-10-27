import rateLimit from 'express-rate-limit';
import { validationResult } from 'express-validator';

const limiter = (windowMs, max, message, extra = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    ...extra,
  });

export const apiLimiter = limiter(15 * 60 * 1000, 400, 'Too many requests. Please wait a few minutes and try again.');
// Login and register: slow down password guessing. Successful logins do not count.
export const authLimiter = limiter(15 * 60 * 1000, 10, 'Too many attempts. Please try again in 15 minutes.', {
  skipSuccessfulRequests: true,
});
// Chat calls an outside service with a free quota, so it gets its own tight limit.
export const chatLimiter = limiter(60 * 1000, 10, 'You are sending messages too quickly. Wait a minute and try again.');

/**
 * CSRF guard. Browsers will not let another website add a custom header to a request,
 * so requiring one on every state-changing call blocks forged cross-site requests.
 * (The cookie is also SameSite=Lax. Two layers.)
 */
export function csrfGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'CounselMate') {
    return res.status(403).json({ message: 'Blocked: missing security header.' });
  }
  next();
}

/** Turns express-validator results into one clean 400 reply. */
export function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const list = errors.array({ onlyFirstError: true });
  return res.status(400).json({
    message: list[0].msg,
    errors: list.map((e) => ({ field: e.path, message: e.msg })),
  });
}

export function notFound(_req, res) {
  res.status(404).json({ message: 'Not found.' });
}

// Express recognises error handlers by their four arguments, so keep all four.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request is too large.' });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'That value already exists.' });
  if (err.code === 'ER_DATA_TOO_LONG' || err.code === 'ER_WARN_DATA_OUT_OF_RANGE' || err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return res.status(400).json({ message: 'One of the values is too long or out of range.' });
  }

  console.error(err);   // full detail stays in the server log only
  res.status(500).json({ message: 'Something went wrong on our side. Please try again.' });
}
