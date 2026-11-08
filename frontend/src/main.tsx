import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProvedorAutenticacao } from './contextos/AutenticacaoContexto';
import { Aplicacao } from './App';
import './estilos.css';

const elementoRaiz = document.getElementById('root');

if (!elementoRaiz) {
  throw new Error('Elemento raiz da aplicação não encontrado.');
}

ReactDOM.createRoot(elementoRaiz).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProvedorAutenticacao>
        <Aplicacao />
      </ProvedorAutenticacao>
    </BrowserRouter>
  </React.StrictMode>,
);
