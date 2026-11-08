import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAutenticacao } from '../contextos/AutenticacaoContexto';
import { Carregando } from './Modal';

export function Protegida() {
  const { usuario, carregando } = useAutenticacao();
  const localizacao = useLocation();

  if (carregando) return <Carregando mensagem="Validando sessão..." />;
  if (!usuario) return <Navigate to="/login" replace state={{ de: localizacao.pathname }} />;
  return <Outlet />;
}
