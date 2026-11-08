import { Router } from 'express';
import { ProdutoController } from '../controllers/ProdutoController';
import { ensureAuthenticated } from '../middlewares/auth';
import { validateBody } from '../middlewares/validateBody';
import { atualizarProdutoSchema, criarProdutoSchema } from '../schemas/produto.schema';

const produtoRoutes = Router();
const produtoController = new ProdutoController();

produtoRoutes.get('/', ensureAuthenticated, produtoController.listar);
produtoRoutes.get('/:id', ensureAuthenticated, produtoController.buscarPorId);
produtoRoutes.put('/:id', ensureAuthenticated, validateBody(atualizarProdutoSchema), produtoController.atualizar);
produtoRoutes.post('/', ensureAuthenticated, validateBody(criarProdutoSchema), produtoController.criar);

export default produtoRoutes;
