import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { z } from 'zod';
import { swaggerDocument } from './config/swagger';
import { AppError } from './errors/AppError';
import { errorHandler } from './middlewares/errorHandler';
import { serializeDecimals } from './middlewares/serializeDecimals';
import authRoutes from './routes/auth.routes';
import clienteRoutes from './routes/cliente.routes';
import fornecedorRoutes from './routes/fornecedor.routes';
import pedidoRoutes from './routes/pedido.routes';
import produtoRoutes from './routes/produto.routes';

// Mensagens padrão do Zod (tipo incorreto, campo desconhecido, e-mail inválido) passam a sair em português.
z.config(z.locales.pt());

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS
  ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : false }));
app.use(serializeDecimals);
app.use(express.json({ limit: '100kb' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/auth', authRoutes);
app.use('/clientes', clienteRoutes);
app.use('/fornecedores', fornecedorRoutes);
app.use('/produtos', produtoRoutes);
app.use('/pedidos', pedidoRoutes);
app.use((_req, _res, next) => next(new AppError('Rota não encontrada.', 404)));
app.use(errorHandler);

export default app;
