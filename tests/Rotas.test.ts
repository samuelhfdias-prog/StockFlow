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

  it('responde 404 em JSON para rotas inexistentes', async () => {
    const resposta = await request(app).get('/rota-inexistente');

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ message: 'Rota não encontrada.' });
  });

  it('responde 413 quando o corpo ultrapassa o limite de 100 KB', async () => {
    const resposta = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@example.com', senha: 'x'.repeat(120_000) }));

    expect(resposta.status).toBe(413);
    expect(resposta.body).toEqual({ message: 'O corpo da requisição excede o tamanho permitido.' });
  });

  it('devolve mensagens de validação em português com status 400', async () => {
    const resposta = await request(app)
      .post('/auth/login')
      .send({ email: 'sem-arroba', senha: 123, extra: true });

    expect(resposta.status).toBe(400);
    expect(resposta.body.message).toBe('Dados inválidos.');
    expect(JSON.stringify(resposta.body.errors)).not.toMatch(/Invalid input|Unrecognized key/);
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
