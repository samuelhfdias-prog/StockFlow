import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../src/services/AuthService';
import type { UsuarioRepository } from '../src/repositories/UsuarioRepository';

const usuarioBase = {
  id: 7,
  nome: 'Operadora Teste',
  email: 'operadora@example.com',
  senhaHash: '',
  cargo: 'OPERADOR',
  criadoEm: new Date('2026-01-01T00:00:00.000Z'),
};

const criarRepositorio = (sobrescritos: Partial<UsuarioRepository> = {}) => ({
  findByEmail: vi.fn<UsuarioRepository['findByEmail']>(),
  findById: vi.fn<UsuarioRepository['findById']>(),
  create: vi.fn<UsuarioRepository['create']>(),
  ...sobrescritos,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthService', () => {
  it('cadastra usuário com hash bcrypt e nunca devolve senhaHash', async () => {
    const criar = vi.fn<UsuarioRepository['create']>(async (dados) => ({
      ...usuarioBase,
      ...dados,
      senhaHash: dados.senhaHash,
    }));
    const repositorio = criarRepositorio({
      findByEmail: vi.fn().mockResolvedValue(null),
      create: criar,
    });
    const servico = new AuthService(repositorio);

    const resultado = await servico.registrar({
      nome: usuarioBase.nome,
      email: usuarioBase.email,
      senha: 'senha-segura',
    });

    const dadosGravados = criar.mock.calls[0][0];
    expect(await bcrypt.compare('senha-segura', dadosGravados.senhaHash)).toBe(true);
    expect(bcrypt.getRounds(dadosGravados.senhaHash)).toBe(10);
    expect(resultado).not.toHaveProperty('senhaHash');
    expect(resultado.cargo).toBe('OPERADOR');
  });

  it('bloqueia cadastro público de administrador', async () => {
    const repositorio = criarRepositorio();
    const servico = new AuthService(repositorio);

    await expect(servico.registrar({
      nome: 'Admin',
      email: 'admin@example.com',
      senha: 'senha-segura',
      cargo: 'ADMIN',
    })).rejects.toMatchObject({ statusCode: 403 });
    expect(repositorio.findByEmail).not.toHaveBeenCalled();
  });

  it('autentica a senha e emite JWT de oito horas', async () => {
    const senhaHash = await bcrypt.hash('senha-segura', 10);
    const repositorio = criarRepositorio({
      findByEmail: vi.fn().mockResolvedValue({ ...usuarioBase, senhaHash }),
    });
    const resultado = await new AuthService(repositorio).login({
      email: usuarioBase.email,
      senha: 'senha-segura',
    });
    const payload = jwt.verify(resultado.token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    expect(payload.id).toBe(usuarioBase.id);
    expect(payload.cargo).toBe('OPERADOR');
    expect(payload.exp! - payload.iat!).toBe(8 * 60 * 60);
    expect(resultado.usuario).not.toHaveProperty('senhaHash');
  });

  it('retorna a mesma falha para e-mail inexistente e senha incorreta', async () => {
    const repositorio = criarRepositorio({ findByEmail: vi.fn().mockResolvedValue(null) });
    const servico = new AuthService(repositorio);

    await expect(servico.login({ email: 'ausente@example.com', senha: 'senha' }))
      .rejects.toMatchObject({ statusCode: 401, message: 'E-mail ou senha inválidos.' });
  });

  it('retorna os dados básicos do usuário autenticado', async () => {
    const repositorio = criarRepositorio({
      findById: vi.fn().mockResolvedValue(usuarioBase),
    });
    await expect(new AuthService(repositorio).me(usuarioBase.id)).resolves.toEqual({
      id: usuarioBase.id,
      nome: usuarioBase.nome,
      email: usuarioBase.email,
      cargo: usuarioBase.cargo,
    });
  });
});
