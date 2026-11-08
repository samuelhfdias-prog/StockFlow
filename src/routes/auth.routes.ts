import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { ensureAuthenticated } from '../middlewares/auth';
import { validateBody } from '../middlewares/validateBody';
import { loginSchema, registrarUsuarioSchema } from '../schemas/auth.schema';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/login', validateBody(loginSchema), authController.login);
authRoutes.post('/registrar', validateBody(registrarUsuarioSchema), authController.registrar);
authRoutes.get('/me', ensureAuthenticated, authController.me);

export default authRoutes;
