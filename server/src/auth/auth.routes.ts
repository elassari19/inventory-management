import express from 'express';
import { AuthController } from './auth.controller';
import { isAuthenticated } from './auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { registerSchema, loginSchema } from './auth.schema';

const router = express.Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', isAuthenticated, AuthController.getCurrentUser);
router.get('/session', AuthController.checkSession);

export default router;
