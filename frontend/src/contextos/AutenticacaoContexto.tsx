import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, definirToken, obterToken } from '../servicos/api';
import type { Usuario } from '../tipos';

type EstadoAutenticacao = {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => void;
};

const ContextoAutenticacao = createContext<EstadoAutenticacao | null>(null);

export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
  const [usuario, definirUsuario] = useState<Usuario | null>(null);
  const [carregando, definirCarregando] = useState(Boolean(obterToken()));

  useEffect(() => {
    if (!obterToken()) return;

    api.me()
      .then(definirUsuario)
      .catch(() => {
        definirToken(null);
        definirUsuario(null);
      })
      .finally(() => definirCarregando(false));
  }, []);

  const valor = useMemo<EstadoAutenticacao>(() => ({
    usuario,
    carregando,
    async entrar(email, senha) {
      const sessao = await api.login(email, senha);
      definirToken(sessao.token);
      definirUsuario(sessao.usuario);
    },
    async cadastrar(nome, email, senha) {
      await api.registrar(nome, email, senha);
    },
    sair() {
      definirToken(null);
      definirUsuario(null);
    },
  }), [usuario, carregando]);

  return <ContextoAutenticacao.Provider value={valor}>{children}</ContextoAutenticacao.Provider>;
}

export function useAutenticacao() {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) throw new Error('useAutenticacao precisa estar dentro de ProvedorAutenticacao.');
  return contexto;
}
