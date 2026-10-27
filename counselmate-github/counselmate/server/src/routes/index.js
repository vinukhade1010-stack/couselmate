import { Router } from 'express';
import { protect, adminOnly, optionalAuth } from '../middleware/auth.js';
import { authLimiter, chatLimiter, handleValidation } from '../middleware/security.js';
import * as auth from '../controllers/authController.js';
import * as colleges from '../controllers/collegeController.js';
import * as users from '../controllers/userController.js';
import * as chat from '../controllers/chatController.js';

const router = Router();

// ----- auth -----
router.post('/auth/register', authLimiter, auth.registerRules, handleValidation, auth.register);
router.post('/auth/login', authLimiter, auth.loginRules, handleValidation, auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', protect, auth.me);

// ----- colleges (public to read, admin to change) -----
router.get('/colleges/meta', colleges.meta);
router.get('/colleges', colleges.list);
router.get('/colleges/:id', colleges.getOne);
router.post('/colleges', protect, adminOnly, colleges.collegeRules, handleValidation, colleges.create);
router.put('/colleges/:id', protect, adminOnly, colleges.collegeRules, handleValidation, colleges.update);
router.delete('/colleges/:id', protect, adminOnly, colleges.remove);

// ----- student -----
router.get('/users/shortlist', protect, users.getShortlist);
router.post('/users/shortlist/:collegeId', protect, users.toggleShortlist);
router.get('/guidance', users.getGuidance);

// ----- chatbot (works logged out too; knows your shortlist if logged in) -----
router.post('/chat', chatLimiter, optionalAuth, chat.chatRules, handleValidation, chat.chat);

export default router;
