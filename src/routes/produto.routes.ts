import { Router } from 'express';
import { ProdutoController } from '../controllers/ProdutoController';
import { ensureAuthenticated } from '../middlewares/auth';
import { validateBody } from '../middlewares/validateBody';
import { criarProdutoSchema } from '../schemas/produto.schema';

const produtoRoutes = Router();
const produtoController = new ProdutoController();

produtoRoutes.post('/', ensureAuthenticated, validateBody(criarProdutoSchema), produtoController.criar);

export default produtoRoutes;
