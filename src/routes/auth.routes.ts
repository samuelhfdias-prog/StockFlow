import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateBody } from '../middlewares/validateBody';
import { registrarUsuarioSchema } from '../schemas/auth.schema';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/registrar', validateBody(registrarUsuarioSchema), authController.registrar);

export default authRoutes;
