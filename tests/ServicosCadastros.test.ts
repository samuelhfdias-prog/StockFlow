import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '../src/generated/prisma/client';
import type { ClienteRepository } from '../src/repositories/ClienteRepository';
import type { FornecedorRepository } from '../src/repositories/FornecedorRepository';
import type { ProdutoRepository } from '../src/repositories/ProdutoRepository';
import { criarClienteSchema } from '../src/schemas/cliente.schema';
import { criarProdutoSchema } from '../src/schemas/produto.schema';
import { ClienteService } from '../src/services/ClienteService';
import { FornecedorService } from '../src/services/FornecedorService';
import {
  calcularMargemLucroPercentual,
  margemMinimaAtendida,
  MENSAGEM_MARGEM_MINIMA,
  ProdutoService,
} from '../src/services/ProdutoService';

const criarRepositorioCliente = (sobrescritos: Partial<ClienteRepository> = {}) => ({
  findByCnpj: vi.fn<ClienteRepository['findByCnpj']>(),
  findByEmail: vi.fn<ClienteRepository['findByEmail']>(),
  create: vi.fn<ClienteRepository['create']>(),
  findAll: vi.fn<ClienteRepository['findAll']>(),
  findByIdWithPedidos: vi.fn<ClienteRepository['findByIdWithPedidos']>(),
  findById: vi.fn<ClienteRepository['findById']>(),
  update: vi.fn<ClienteRepository['update']>(),
  countPedidosByClienteId: vi.fn<ClienteRepository['countPedidosByClienteId']>(),
  delete: vi.fn<ClienteRepository['delete']>(),
  ...sobrescritos,
});

const criarRepositorioFornecedor = (sobrescritos: Partial<FornecedorRepository> = {}) => ({
  findByCnpj: vi.fn<FornecedorRepository['findByCnpj']>(),
  findById: vi.fn<FornecedorRepository['findById']>(),
  create: vi.fn<FornecedorRepository['create']>(),
  update: vi.fn<FornecedorRepository['update']>(),
  findByIdWithProdutoCount: vi.fn<FornecedorRepository['findByIdWithProdutoCount']>(),
  delete: vi.fn<FornecedorRepository['delete']>(),
  findAll: vi.fn<FornecedorRepository['findAll']>(),
  findByIdWithProdutos: vi.fn<FornecedorRepository['findByIdWithProdutos']>(),
  ...sobrescritos,
});

const criarRepositorioProduto = (sobrescritos: Partial<ProdutoRepository> = {}) => ({
  findBySku: vi.fn<ProdutoRepository['findBySku']>(),
  findById: vi.fn<ProdutoRepository['findById']>(),
  create: vi.fn<ProdutoRepository['create']>(),
  update: vi.fn<ProdutoRepository['update']>(),
  countItensPedidoByProdutoId: vi.fn<ProdutoRepository['countItensPedidoByProdutoId']>(),
  delete: vi.fn<ProdutoRepository['delete']>(),
  findAll: vi.fn<ProdutoRepository['findAll']>(),
  findByIdWithFornecedor: vi.fn<ProdutoRepository['findByIdWithFornecedor']>(),
  ...sobrescritos,
});

describe('Services de cadastros', () => {
  it('limita valores monetários às colunas DECIMAL(10,2) e rejeita centavos fracionados', () => {
    const produto = {
      sku: 'SKU-1', nome: 'Produto', precoCusto: 10, precoVenda: 15, estoqueAtual: 4, estoqueMinimo: 2, fornecedorId: 3,
    };

    expect(criarProdutoSchema.safeParse(produto).success).toBe(true);
    expect(criarProdutoSchema.safeParse({ ...produto, precoVenda: 19.99 }).success).toBe(true);
    expect(criarProdutoSchema.safeParse({ ...produto, precoVenda: 10.005 }).success).toBe(false);
    expect(criarProdutoSchema.safeParse({ ...produto, precoVenda: 1e12 }).success).toBe(false);
    expect(criarProdutoSchema.safeParse({ ...produto, estoqueAtual: 3_000_000_000 }).success).toBe(false);
    expect(criarClienteSchema.safeParse({
      razaoSocial: 'Cliente', cnpj: '12345678000190', email: 'c@example.com', telefone: '11999999999', limiteCredito: 99_999_999.99,
    }).success).toBe(true);
  });

  it('calcula a margem de lucro com Decimal, arredondando metade para cima', async () => {
    expect(calcularMargemLucroPercentual('1000', '1010.05')).toBe(1.01);
    expect(calcularMargemLucroPercentual(new Prisma.Decimal('80'), new Prisma.Decimal('100'))).toBe(25);

    const repositorio = criarRepositorioProduto({
      findByIdWithFornecedor: vi.fn().mockResolvedValue({
        id: 1,
        precoCusto: new Prisma.Decimal('1000'),
        precoVenda: new Prisma.Decimal('1010.05'),
        estoqueAtual: 5,
        estoqueMinimo: 5,
      }),
    });
    const produto = await new ProdutoService(repositorio, criarRepositorioFornecedor()).buscarPorId('1');

    expect(produto.margemLucroPercentual).toBe(1.01);
    expect(produto.estoqueCritico).toBe(true);
  });

  it('repassa o filtro de estoque crítico ao repositório em vez de filtrar em memória', async () => {
    const repositorio = criarRepositorioProduto({
      findAll: vi.fn().mockResolvedValue([{ id: 1, estoqueAtual: 2, estoqueMinimo: 5 }]),
    });
    const resultado = await new ProdutoService(repositorio, criarRepositorioFornecedor())
      .listar({ estoqueCritico: 'true', fornecedorId: '3' });

    expect(repositorio.findAll).toHaveBeenCalledWith({ estoqueCritico: true, fornecedorId: 3 });
    expect(resultado).toEqual([{ id: 1, estoqueAtual: 2, estoqueMinimo: 5, estoqueCritico: true }]);
  });

  it('recusa cliente com CNPJ repetido', async () => {
    const repositorio = criarRepositorioCliente({
      findByCnpj: vi.fn().mockResolvedValue({ id: 1 }),
    });
    const servico = new ClienteService(repositorio);

    await expect(servico.criar({
      razaoSocial: 'Cliente',
      cnpj: '12345678000190',
      email: 'cliente@example.com',
      telefone: '11999999999',
      limiteCredito: 1000,
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('recusa fornecedor com CNPJ repetido', async () => {
    const repositorio = criarRepositorioFornecedor({
      findByCnpj: vi.fn().mockResolvedValue({ id: 1 }),
    });
    const servico = new FornecedorService(repositorio);

    await expect(servico.criar({
      nomeFantasia: 'Fornecedor',
      cnpj: '12345678000190',
      emailContato: 'contato@example.com',
      prazoEntrega: 5,
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  it('exige margem mínima de 20% sobre o custo e fornecedor ativo', async () => {
    const produtos = criarRepositorioProduto({
      findBySku: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 1 }),
    });
    const fornecedorInativo = criarRepositorioFornecedor({
      findById: vi.fn().mockResolvedValue({ id: 3, ativo: false }),
    });
    const servico = new ProdutoService(produtos, fornecedorInativo);
    const dados = {
      sku: 'SKU-1',
      nome: 'Produto',
      precoCusto: 10,
      precoVenda: 15,
      estoqueAtual: 4,
      estoqueMinimo: 2,
      fornecedorId: 3,
    };

    await expect(servico.criar({ ...dados, precoVenda: 10 }))
      .rejects.toMatchObject({ statusCode: 422 });
    await expect(servico.criar(dados))
      .rejects.toMatchObject({ statusCode: 422, message: 'O fornecedor informado está inativo.' });
    expect(produtos.create).not.toHaveBeenCalled();
  });

  it.each([
    { custo: '10', venda: '11.99', atende: false },
    { custo: '10', venda: '12', atende: true },
    { custo: '10.10', venda: '12.12', atende: true },
    { custo: '10.10', venda: '12.11', atende: false },
    { custo: '0.07', venda: '0.08', atende: false },
    { custo: '0.07', venda: '0.09', atende: true },
    { custo: '99999999.99', venda: '99999999.99', atende: false },
  ])('margem mínima de 20%: custo $custo e venda $venda => $atende', ({ custo, venda, atende }) => {
    expect(margemMinimaAtendida(custo, venda)).toBe(atende);
  });

  it('recusa com 422 e mensagem clara o produto que não atinge a margem mínima', async () => {
    const produtos = criarRepositorioProduto({ findBySku: vi.fn().mockResolvedValue(null) });
    const servico = new ProdutoService(produtos, criarRepositorioFornecedor());

    await expect(servico.criar({
      sku: 'SKU-2', nome: 'Produto', precoCusto: 100, precoVenda: 119.99, estoqueAtual: 1, estoqueMinimo: 1, fornecedorId: 3,
    })).rejects.toMatchObject({ statusCode: 422, message: MENSAGEM_MARGEM_MINIMA });
    expect(produtos.findBySku).not.toHaveBeenCalled();
  });
});
