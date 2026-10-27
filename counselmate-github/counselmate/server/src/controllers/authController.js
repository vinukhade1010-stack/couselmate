import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import * as Users from '../models/User.js';
import { issueToken, clearToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

// Used when the email does not exist, so a wrong email takes as long as a wrong password.
// Otherwise response time would reveal which emails have accounts.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export const registerRules = [
  body('name').isString().trim().isLength({ min: 2, max: 60 }).withMessage('Enter your name (2 to 60 characters).'),
  body('email').isString().trim().isEmail().withMessage('Enter a valid email address.').bail()
    .customSanitizer((v) => v.toLowerCase()),
  body('password').isString().isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters.').bail()
    .matches(/[A-Za-z]/).withMessage('Password needs at least one letter.').bail()
    .matches(/\d/).withMessage('Password needs at least one number.'),
];

export const loginRules = [
  body('email').isString().trim().isEmail().withMessage('Enter a valid email address.').bail()
    .customSanitizer((v) => v.toLowerCase()),
  body('password').isString().isLength({ min: 1, max: 72 }).withMessage('Enter your password.'),
];

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;     // role is never read from the request
  if (await Users.emailExists(email)) {
    return res.status(409).json({ message: 'An account with this email already exists. Try logging in.' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const id = await Users.createStudent({ name, email, passwordHash });
  issueToken(res, id);
  res.status(201).json({ user: await Users.toPublicUser(await Users.findById(id)) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await Users.findByEmailWithHash(email);
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) {
    // one message for both cases: never say which part was wrong
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }
  issueToken(res, user.id);
  res.json({ user: await Users.toPublicUser(user) });
});

export const logout = (_req, res) => {
  clearToken(res);
  res.json({ message: 'Logged out.' });
};

export const me = asyncHandler(async (req, res) => {
  res.json({ user: await Users.toPublicUser(req.user) });
});
