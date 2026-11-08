import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './componentes/Layout';
import { Protegida } from './componentes/Protegida';
import { PaginaCadastro } from './paginas/Cadastro';
import { PaginaClientes } from './paginas/Clientes';
import { PaginaFornecedores } from './paginas/Fornecedores';
import { PaginaLogin } from './paginas/Login';
import { PainelPrincipal } from './paginas/Painel';
import { PaginaPedidos } from './paginas/Pedidos';
import { PaginaProdutos } from './paginas/Produtos';

export function Aplicacao() {
  return (
    <Routes>
      <Route path="/login" element={<PaginaLogin />} />
      <Route path="/cadastro" element={<PaginaCadastro />} />
      <Route element={<Protegida />}>
        <Route element={<Layout />}>
          <Route index element={<PainelPrincipal />} />
          <Route path="/clientes" element={<PaginaClientes />} />
          <Route path="/fornecedores" element={<PaginaFornecedores />} />
          <Route path="/produtos" element={<PaginaProdutos />} />
          <Route path="/pedidos" element={<PaginaPedidos />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
