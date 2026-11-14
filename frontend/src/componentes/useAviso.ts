import { useCallback, useState } from 'react';
import { descreverErro } from '../servicos/api';
import type { AvisoTela } from '../tipos';

export function useAviso() {
  const [aviso, definirAviso] = useState<AvisoTela | null>(null);

  const mostrarErro = useCallback((falha: unknown, mensagemPadrao: string) => {
    definirAviso(descreverErro(falha, mensagemPadrao));
  }, []);

  const mostrarMensagem = useCallback((mensagem: string, severidade: AvisoTela['severidade'] = 'sucesso') => {
    definirAviso({ mensagem, severidade });
  }, []);

  const limpar = useCallback(() => definirAviso(null), []);

  return { aviso, mostrarErro, mostrarMensagem, limpar };
}
