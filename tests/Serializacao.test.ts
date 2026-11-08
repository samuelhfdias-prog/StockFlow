import express from 'express';
import request from 'supertest';
import { Prisma } from '../src/generated/prisma/client';
import { serializeDecimals } from '../src/middlewares/serializeDecimals';
import { describe, expect, it } from 'vitest';

describe('Serialização de valores Decimal', () => {
  it('responde números JSON e preserva objetos aninhados e datas ISO', async () => {
    const aplicacao = express();
    aplicacao.use(serializeDecimals);
    aplicacao.get('/decimal', (_req, res) => res.json({
      limiteCredito: new Prisma.Decimal('1200.50'),
      pedido: {
        valorLiquido: new Prisma.Decimal('100.25'),
        criadoEm: new Date('2026-01-01T00:00:00.000Z'),
      },
    }));

    const resposta = await request(aplicacao).get('/decimal');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual({
      limiteCredito: 1200.5,
      pedido: {
        valorLiquido: 100.25,
        criadoEm: '2026-01-01T00:00:00.000Z',
      },
    });
    expect(typeof resposta.body.limiteCredito).toBe('number');
  });
});
