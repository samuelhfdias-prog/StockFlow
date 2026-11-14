import { Prisma } from '../src/generated/prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { calcularDesconto, PedidoService } from '../src/services/PedidoService';

type PedidoTesteOpcoes = {
  clienteAtivo?: boolean;
  credito?: string;
  estoques?: number[];
  falharDebito?: boolean;
};

const criarBancoEmMemoria = ({
  clienteAtivo = true,
  credito = '10000.00',
  estoques = [14, 100],
  falharDebito = false,
}: PedidoTesteOpcoes = {}) => {
  const estado = {
    cliente: { id: 1, ativo: clienteAtivo, limiteCredito: new Prisma.Decimal(credito) },
    produtos: [
      { id: 3, sku: 'SKU-A', nome: 'Item A', precoVenda: new Prisma.Decimal('100.00'), estoqueAtual: estoques[0], estoqueMinimo: 5, fornecedorId: 7, fornecedor: { nomeFantasia: 'Fornecedor A', prazoEntrega: 3 } },
      { id: 8, sku: 'SKU-B', nome: 'Item B', precoVenda: new Prisma.Decimal('350.00'), estoqueAtual: estoques[1], estoqueMinimo: 4, fornecedorId: 9, fornecedor: { nomeFantasia: 'Fornecedor B', prazoEntrega: 7 } },
    ],
    pedidos: [] as Array<Record<string, unknown>>,
    chamadasTransacao: 0,
  };

  const tx = {
    cliente: {
      findUnique: vi.fn(async () => estado.cliente),
      updateMany: vi.fn(async ({ where, data }: { where: { limiteCredito: { gte: Prisma.Decimal } }; data: { limiteCredito: { decrement: Prisma.Decimal } } }) => {
        if (falharDebito || estado.cliente.limiteCredito.lt(where.limiteCredito.gte)) return { count: 0 };
        estado.cliente.limiteCredito = estado.cliente.limiteCredito.minus(data.limiteCredito.decrement);
        return { count: 1 };
      }),
    },
    produto: {
      findMany: vi.fn(async ({ where }: { where: { id: { in: number[] } } }) => estado.produtos
        .filter((produto) => where.id.in.includes(produto.id))
        .map((produto) => ({ ...produto, fornecedor: { ...produto.fornecedor } }))),
      updateMany: vi.fn(async ({ where, data }: { where: { id: number; estoqueAtual: { gte: number } }; data: { estoqueAtual: { decrement: number } } }) => {
        const produto = estado.produtos.find((item) => item.id === where.id && item.estoqueAtual >= where.estoqueAtual.gte);
        if (!produto) return { count: 0 };
        produto.estoqueAtual -= data.estoqueAtual.decrement;
        return { count: 1 };
      }),
    },
    pedido: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const pedido = {
          id: 50 + estado.pedidos.length,
          status: data.status,
          criadoEm: new Date('2026-11-08T12:00:00Z'),
          valorBruto: data.valorBruto,
          valorDesconto: data.valorDesconto,
          valorLiquido: data.valorLiquido,
        };
        estado.pedidos.push(pedido);
        return pedido;
      }),
    },
  };

  const prismaFalso = {
    $transaction: vi.fn(async (callback: (transacao: typeof tx) => Promise<unknown>) => {
      estado.chamadasTransacao += 1;
      const limiteAntes = estado.cliente.limiteCredito;
      const estoquesAntes = estado.produtos.map((produto) => produto.estoqueAtual);
      const pedidosAntes = estado.pedidos.length;

      try {
        return await callback(tx);
      } catch (erro) {
        estado.cliente.limiteCredito = limiteAntes;
        estado.produtos.forEach((produto, indice) => { produto.estoqueAtual = estoquesAntes[indice]; });
        estado.pedidos.length = pedidosAntes;
        throw erro;
      }
    }),
  };

  return { estado, tx, prismaFalso };
};

describe('PedidoService', () => {
  it('aplica desconto de 10%, baixa estoque/crédito e gera alerta de reposição', async () => {
    const banco = criarBancoEmMemoria();
    const servico = new PedidoService(banco.prismaFalso as never);

    const resultado = await servico.criarPedido({
      clienteId: 1,
      itens: [{ produtoId: 3, quantidade: 12 }, { produtoId: 8, quantidade: 20 }],
    });

    expect(resultado.pedido.valorBruto.toString()).toBe('8200');
    expect(resultado.pedido.valorDesconto.toString()).toBe('820');
    expect(resultado.pedido.valorLiquido.toString()).toBe('7380');
    expect(banco.estado.produtos[0].estoqueAtual).toBe(2);
    expect(banco.estado.cliente.limiteCredito.toString()).toBe('2620');
    expect(resultado.alertasReposicao).toEqual([{
      sku: 'SKU-A',
      nome: 'Item A',
      estoqueAtual: 2,
      estoqueMinimo: 5,
      nomeFantasia: 'Fornecedor A',
      prazoEntrega: 3,
    }]);
    expect(banco.prismaFalso.$transaction).toHaveBeenCalledTimes(1);
  });

  it('aplica desconto de 5% a partir de dez unidades', async () => {
    const banco = criarBancoEmMemoria();
    const resultado = await new PedidoService(banco.prismaFalso as never).criarPedido({
      clienteId: 1,
      itens: [{ produtoId: 3, quantidade: 10 }],
    });

    expect(resultado.pedido.valorBruto.toString()).toBe('1000');
    expect(resultado.pedido.valorDesconto.toString()).toBe('50');
    expect(resultado.pedido.valorLiquido.toString()).toBe('950');
  });

  it('bloqueia cliente inativo, falta de estoque e crédito insuficiente sem persistir alterações', async () => {
    const pedido = { clienteId: 1, itens: [{ produtoId: 3, quantidade: 12 }] };
    const clienteInativo = criarBancoEmMemoria({ clienteAtivo: false });
    await expect(new PedidoService(clienteInativo.prismaFalso as never).criarPedido(pedido))
      .rejects.toMatchObject({ statusCode: 403 });

    const semEstoque = criarBancoEmMemoria({ estoques: [2, 100] });
    await expect(new PedidoService(semEstoque.prismaFalso as never).criarPedido(pedido))
      .rejects.toMatchObject({ statusCode: 422, message: expect.stringContaining('SKU SKU-A') });
    expect(semEstoque.estado.produtos[0].estoqueAtual).toBe(2);

    const semCredito = criarBancoEmMemoria({ credito: '10.00' });
    await expect(new PedidoService(semCredito.prismaFalso as never).criarPedido(pedido))
      .rejects.toMatchObject({ statusCode: 422, message: 'Crédito Insuficiente para aprovar o pedido' });
    expect(semCredito.estado.produtos[0].estoqueAtual).toBe(14);
    expect(semCredito.estado.pedidos).toHaveLength(0);
  });

  it('filtra pedidos por status e cliente e rejeita filtros inválidos', async () => {
    const repositorio = {
      findByIdWithClienteAndItens: vi.fn(),
      findAll: vi.fn().mockResolvedValue([{ id: 3 }]),
    };
    const servico = new PedidoService(undefined, repositorio as never);

    await expect(servico.listar({ status: 'APROVADO', clienteId: '4' })).resolves.toEqual([{ id: 3 }]);
    expect(repositorio.findAll).toHaveBeenCalledWith({ status: 'APROVADO', clienteId: 4 });
    await expect(servico.listar({ status: 'DESCONHECIDO' })).rejects.toMatchObject({ statusCode: 400 });
  });

  it.each([
    { unidades: 9, bruto: '2500.00', taxa: '0', desconto: '0' },
    { unidades: 9, bruto: '2500.01', taxa: '0.05', desconto: '125' },
    { unidades: 10, bruto: '100.00', taxa: '0.05', desconto: '5' },
    { unidades: 29, bruto: '7000.00', taxa: '0.05', desconto: '350' },
    { unidades: 29, bruto: '7000.01', taxa: '0.1', desconto: '700' },
    { unidades: 30, bruto: '100.00', taxa: '0.1', desconto: '10' },
    { unidades: 10, bruto: '80.30', taxa: '0.05', desconto: '4.02' },
  ])('calcula o desconto progressivo com $unidades unidades e bruto $bruto', ({ unidades, bruto, taxa, desconto }) => {
    const resultado = calcularDesconto(unidades, new Prisma.Decimal(bruto));

    expect(resultado.taxa.toString()).toBe(taxa);
    expect(resultado.valorDesconto.toString()).toBe(desconto);
    expect(resultado.valorLiquido.toString()).toBe(new Prisma.Decimal(bruto).minus(desconto).toString());
  });

  it('restaura estoque e crédito ao cancelar um pedido aprovado e bloqueia novo estorno', async () => {
    const estado = {
      pedido: {
        id: 5,
        clienteId: 1,
        status: 'APROVADO',
        valorLiquido: new Prisma.Decimal('120.50'),
        itensPedido: [{ produtoId: 3, quantidade: 2 }, { produtoId: 3, quantidade: 1 }],
      },
      estoque: 4,
      credito: new Prisma.Decimal('300'),
    };
    const tx = {
      pedido: {
        findUnique: vi.fn(async () => ({ ...estado.pedido, itensPedido: estado.pedido.itensPedido.map((item) => ({ ...item })) })),
        updateMany: vi.fn(async () => { estado.pedido.status = 'CANCELADO'; return { count: 1 }; }),
      },
      produto: {
        updateMany: vi.fn(async ({ data }: { data: { estoqueAtual: { increment: number } } }) => {
          estado.estoque += data.estoqueAtual.increment;
          return { count: 1 };
        }),
      },
      cliente: {
        update: vi.fn(async ({ data }: { data: { limiteCredito: { increment: Prisma.Decimal } } }) => {
          estado.credito = estado.credito.add(data.limiteCredito.increment);
          return {};
        }),
      },
    };
    const prismaFalso = {
      $transaction: async (callback: (transacao: typeof tx) => Promise<unknown>) => callback(tx),
    };
    const servico = new PedidoService(prismaFalso as never);
    const resultado = await servico.cancelarPedido('5');

    expect(estado.pedido.status).toBe('CANCELADO');
    expect(estado.estoque).toBe(7);
    expect(estado.credito.toString()).toBe('420.5');
    expect(resultado.estorno.itensEstornados).toBe(2);
    await expect(servico.cancelarPedido('5')).rejects.toMatchObject({ statusCode: 409 });
  });
});
