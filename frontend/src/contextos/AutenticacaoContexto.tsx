import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, definirToken, ErroHttp, obterToken, registrarAoSessaoExpirar } from '../servicos/api';
import type { Usuario } from '../tipos';

type EstadoAutenticacao = {
  usuario: Usuario | null;
  carregando: boolean;
  sessaoExpirada: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => void;
};

const ContextoAutenticacao = createContext<EstadoAutenticacao | null>(null);

export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
  const [usuario, definirUsuario] = useState<Usuario | null>(null);
  const [carregando, definirCarregando] = useState(Boolean(obterToken()));
  const [sessaoExpirada, definirSessaoExpirada] = useState(false);

  useEffect(() => {
    registrarAoSessaoExpirar(() => {
      definirUsuario(null);
      definirSessaoExpirada(true);
    });

    if (!obterToken()) return () => registrarAoSessaoExpirar(undefined);

    api.me()
      .then(definirUsuario)
      .catch((falha) => {
        // Só descarta o token quando a API o recusa; uma queda de rede não deve apagar a sessão.
        if (falha instanceof ErroHttp && falha.status === 401) definirToken(null);
        definirUsuario(null);
      })
      .finally(() => definirCarregando(false));

    return () => registrarAoSessaoExpirar(undefined);
  }, []);

  const valor = useMemo<EstadoAutenticacao>(() => ({
    usuario,
    carregando,
    sessaoExpirada,
    async entrar(email, senha) {
      const sessao = await api.login(email, senha);
      definirToken(sessao.token);
      definirSessaoExpirada(false);
      definirUsuario(sessao.usuario);
    },
    async cadastrar(nome, email, senha) {
      await api.registrar(nome, email, senha);
    },
    sair() {
      definirToken(null);
      definirUsuario(null);
    },
  }), [usuario, carregando, sessaoExpirada]);

  return <ContextoAutenticacao.Provider value={valor}>{children}</ContextoAutenticacao.Provider>;
}

export function useAutenticacao() {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) throw new Error('useAutenticacao precisa estar dentro de ProvedorAutenticacao.');
  return contexto;
}
