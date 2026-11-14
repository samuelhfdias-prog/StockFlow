import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAutenticacao } from '../contextos/AutenticacaoContexto';
import type { AvisoTela } from '../tipos';
import { Carregando } from './Modal';

export function Protegida() {
  const { usuario, carregando, sessaoExpirada } = useAutenticacao();
  const localizacao = useLocation();

  if (carregando) return <Carregando mensagem="Validando sessão..." />;
  if (!usuario) {
    const aviso: AvisoTela | undefined = sessaoExpirada
      ? { titulo: 'Sessão expirada', mensagem: 'Entre novamente para continuar.', severidade: 'alerta' }
      : undefined;
    return <Navigate to="/login" replace state={{ de: localizacao.pathname, aviso }} />;
  }
  return <Outlet />;
}
