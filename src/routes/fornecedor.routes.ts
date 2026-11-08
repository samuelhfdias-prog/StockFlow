import { Router } from 'express';
import { FornecedorController } from '../controllers/FornecedorController';
import { ensureAuthenticated } from '../middlewares/auth';
import { validateBody } from '../middlewares/validateBody';
import { criarFornecedorSchema } from '../schemas/fornecedor.schema';

const fornecedorRoutes = Router();
const fornecedorController = new FornecedorController();

fornecedorRoutes.get('/', ensureAuthenticated, fornecedorController.listar);
fornecedorRoutes.post('/', ensureAuthenticated, validateBody(criarFornecedorSchema), fornecedorController.criar);

export default fornecedorRoutes;
