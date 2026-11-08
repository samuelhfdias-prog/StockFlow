import { Router } from 'express';
import { ClienteController } from '../controllers/ClienteController';
import { ensureAuthenticated } from '../middlewares/auth';
import { validateBody } from '../middlewares/validateBody';
import { atualizarClienteSchema, criarClienteSchema } from '../schemas/cliente.schema';

const clienteRoutes = Router();
const clienteController = new ClienteController();

clienteRoutes.get('/', ensureAuthenticated, clienteController.listar);
clienteRoutes.get('/:id', ensureAuthenticated, clienteController.buscarPorId);
clienteRoutes.put('/:id', ensureAuthenticated, validateBody(atualizarClienteSchema), clienteController.atualizar);
clienteRoutes.delete('/:id', ensureAuthenticated, clienteController.remover);
clienteRoutes.post('/', ensureAuthenticated, validateBody(criarClienteSchema), clienteController.criar);

export default clienteRoutes;
