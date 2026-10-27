import { body } from 'express-validator';
import { asyncHandler } from '../utils/helpers.js';
import { answer } from '../services/chatService.js';

export const chatRules = [
  body('message').isString().trim().isLength({ min: 1, max: 300 }).withMessage('Type a question (300 characters at most).'),
  body('history').optional().isArray({ max: 6 }).withMessage('Invalid chat history.'),
  body('history.*.role').optional().isIn(['user', 'bot']).withMessage('Invalid chat history.'),
  body('history.*.text').optional().isString().isLength({ max: 800 }).withMessage('Invalid chat history.'),
];

export const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  // keep only well-formed history entries; anything else is silently dropped
  const history = (Array.isArray(req.body.history) ? req.body.history : []).filter(
    (h) => h && typeof h.text === 'string' && (h.role === 'user' || h.role === 'bot')
  );
  const result = await answer({ message, history, user: req.user });
  res.json(result);
});
