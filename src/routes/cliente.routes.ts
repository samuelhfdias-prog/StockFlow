import { Router } from 'express';
import { ClienteController } from '../controllers/ClienteController';
import { ensureAuthenticated } from '../middlewares/auth';
import { validateBody } from '../middlewares/validateBody';
import { criarClienteSchema } from '../schemas/cliente.schema';

const clienteRoutes = Router();
const clienteController = new ClienteController();

clienteRoutes.get('/', ensureAuthenticated, clienteController.listar);
clienteRoutes.get('/:id', ensureAuthenticated, clienteController.buscarPorId);
clienteRoutes.post('/', ensureAuthenticated, validateBody(criarClienteSchema), clienteController.criar);

export default clienteRoutes;
