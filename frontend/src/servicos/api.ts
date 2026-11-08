import type {
  AlertaReposicao,
  AtualizarCliente,
  AtualizarFornecedor,
  AtualizarProduto,
  Cliente,
  CriarCliente,
  CriarFornecedor,
  CriarPedido,
  CriarProduto,
  ErroApi,
  Fornecedor,
  Pedido,
  PedidoCriado,
  Produto,
  Usuario,
  UsuarioLogin,
} from '../tipos';

const enderecoApi = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');
const chaveToken = 'stockflow.token';

let tokenAtual = typeof window === 'undefined' ? null : window.localStorage.getItem(chaveToken);

export const definirToken = (token: string | null) => {
  tokenAtual = token;

  if (typeof window !== 'undefined') {
    if (token) window.localStorage.setItem(chaveToken, token);
    else window.localStorage.removeItem(chaveToken);
  }
};

export const obterToken = () => tokenAtual;

const mensagensPorStatus: Record<number, string> = {
  400: 'Confira os dados informados.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Você não tem permissão para esta operação.',
  404: 'O registro solicitado não foi encontrado.',
  409: 'A operação conflita com dados já existentes ou relacionados.',
  422: 'A regra de negócio não permite esta operação.',
};

const extrairErro = (corpo: unknown, status: number): ErroApi => {
  if (typeof corpo === 'object' && corpo !== null && 'message' in corpo) {
    const resposta = corpo as ErroApi;
    const detalhes = resposta.errors?.map((erro) => `${erro.path}: ${erro.message}`).join(' · ');
    return {
      message: detalhes ? `${resposta.message} ${detalhes}` : resposta.message,
      errors: resposta.errors,
    };
  }

  return { message: mensagensPorStatus[status] || 'Não foi possível concluir a solicitação.' };
};

const requisitar = async <T>(rota: string, opcoes: RequestInit = {}): Promise<T> => {
  const cabecalhos = new Headers(opcoes.headers);
  if (opcoes.body && !(opcoes.body instanceof FormData)) cabecalhos.set('Content-Type', 'application/json');
  if (tokenAtual) cabecalhos.set('Authorization', `Bearer ${tokenAtual}`);

  let resposta: Response;
  try {
    resposta = await fetch(`${enderecoApi}${rota}`, { ...opcoes, headers: cabecalhos });
  } catch {
    throw new Error('Não foi possível conectar à API. Verifique se o servidor está em execução.');
  }

  const corpo: unknown = resposta.status === 204 ? undefined : await resposta.json().catch(() => undefined);
  if (!resposta.ok) {
    const erro = extrairErro(corpo, resposta.status);
    throw new Error(erro.message || mensagensPorStatus[resposta.status] || 'Falha na solicitação.');
  }

  return corpo as T;
};

const enviar = (metodo: string, dados?: unknown): RequestInit => ({
  method: metodo,
  ...(dados === undefined ? {} : { body: JSON.stringify(dados) }),
});

const parametros = (valores: Record<string, string | number | boolean | undefined>) => {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(valores)) {
    if (valor !== undefined && valor !== '') busca.set(chave, String(valor));
  }
  const texto = busca.toString();
  return texto ? `?${texto}` : '';
};

export const api = {
  login: (email: string, senha: string) => requisitar<UsuarioLogin>('/auth/login', enviar('POST', { email, senha })),
  registrar: (nome: string, email: string, senha: string) => requisitar<Usuario>('/auth/registrar', enviar('POST', { nome, email, senha })),
  me: () => requisitar<Usuario>('/auth/me'),

  listarClientes: (filtros: { ativo?: boolean; razaoSocial?: string } = {}) => requisitar<Cliente[]>(`/clientes${parametros(filtros)}`),
  buscarCliente: (id: number) => requisitar<Cliente>(`/clientes/${id}`),
  criarCliente: (dados: CriarCliente) => requisitar<Cliente>('/clientes', enviar('POST', dados)),
  atualizarCliente: (id: number, dados: AtualizarCliente) => requisitar<Cliente>(`/clientes/${id}`, enviar('PUT', dados)),
  excluirCliente: (id: number) => requisitar<void>(`/clientes/${id}`, enviar('DELETE')),

  listarFornecedores: () => requisitar<Fornecedor[]>('/fornecedores'),
  buscarFornecedor: (id: number) => requisitar<Fornecedor>(`/fornecedores/${id}`),
  criarFornecedor: (dados: CriarFornecedor) => requisitar<Fornecedor>('/fornecedores', enviar('POST', dados)),
  atualizarFornecedor: (id: number, dados: AtualizarFornecedor) => requisitar<Fornecedor>(`/fornecedores/${id}`, enviar('PUT', dados)),
  excluirFornecedor: (id: number) => requisitar<void>(`/fornecedores/${id}`, enviar('DELETE')),

  listarProdutos: (filtros: { fornecedorId?: number; estoqueCritico?: boolean } = {}) => requisitar<Produto[]>(`/produtos${parametros(filtros)}`),
  buscarProduto: (id: number) => requisitar<Produto>(`/produtos/${id}`),
  criarProduto: (dados: CriarProduto) => requisitar<Produto>('/produtos', enviar('POST', dados)),
  atualizarProduto: (id: number, dados: AtualizarProduto) => requisitar<Produto>(`/produtos/${id}`, enviar('PUT', dados)),
  excluirProduto: (id: number) => requisitar<void>(`/produtos/${id}`, enviar('DELETE')),

  listarPedidos: (filtros: { status?: string; clienteId?: number } = {}) => requisitar<Pedido[]>(`/pedidos${parametros(filtros)}`),
  buscarPedido: (id: number) => requisitar<Pedido>(`/pedidos/${id}`),
  criarPedido: (dados: CriarPedido) => requisitar<PedidoCriado>('/pedidos', enviar('POST', dados)),
  cancelarPedido: (id: number) => requisitar<{ pedido: Pedido; estorno: { creditoRestaurado: number; itensEstornados: number } }>(`/pedidos/${id}/cancelar`, enviar('PATCH')),
};

export type { AlertaReposicao };
