import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../src/middlewares/errorHandler';
import app from '../src/app';
import pedidoRoutes from '../src/routes/pedido.routes';

describe('Rotas protegidas', () => {
  it('protege GET /pedidos antes de chamar o service', async () => {
    const aplicacao = express();
    aplicacao.use('/pedidos', pedidoRoutes);
    aplicacao.use(errorHandler);

    const resposta = await request(aplicacao).get('/pedidos');

    expect(resposta.status).toBe(401);
  });

  it('protege GET /auth/me sem consultar um usuário sem token', async () => {
    const resposta = await request(app).get('/auth/me');

    expect(resposta.status).toBe(401);
  });

  it('aceita preflight CORS das portas de desenvolvimento e container', async () => {
    const origins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
    ];

    for (const origem of origins) {
      const resposta = await request(app)
        .options('/auth/me')
        .set('Origin', origem)
        .set('Access-Control-Request-Method', 'GET');

      expect(resposta.headers['access-control-allow-origin']).toBe(origem);
    }
  });
});
