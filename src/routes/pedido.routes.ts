import { Router } from 'express';
import { PedidoController } from '../controllers/PedidoController';
import { ensureAuthenticated } from '../middlewares/auth';
import { validateBody } from '../middlewares/validateBody';
import { criarPedidoSchema } from '../schemas/pedido.schema';

const pedidoRoutes = Router();
const pedidoController = new PedidoController();

pedidoRoutes.get('/:id', ensureAuthenticated, pedidoController.buscarPorId);
pedidoRoutes.post('/', ensureAuthenticated, validateBody(criarPedidoSchema), pedidoController.criarPedido);

export default pedidoRoutes;
