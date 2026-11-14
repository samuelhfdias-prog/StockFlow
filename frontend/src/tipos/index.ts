export type Usuario = {
  id: number;
  nome: string;
  email: string;
  cargo: 'ADMIN' | 'OPERADOR';
};

export type UsuarioLogin = {
  token: string;
  usuario: Usuario;
};

export type Cliente = {
  id: number;
  razaoSocial: string;
  cnpj: string;
  email: string;
  telefone: string;
  limiteCredito: number;
  ativo: boolean;
  pedidos?: PedidoResumo[];
};

export type Fornecedor = {
  id: number;
  nomeFantasia: string;
  cnpj: string;
  emailContato: string;
  prazoEntrega: number;
  ativo: boolean;
  _count?: { produtos: number };
  produtos?: Produto[];
};

export type Produto = {
  id: number;
  sku: string;
  nome: string;
  precoCusto: number;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  fornecedorId: number;
  fornecedor?: Pick<Fornecedor, 'id' | 'nomeFantasia' | 'cnpj' | 'ativo'> | Fornecedor;
  estoqueCritico?: boolean;
  margemLucroPercentual?: number;
};

export type ItemPedido = {
  id: number;
  pedidoId: number;
  produtoId: number;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  produto?: Pick<Produto, 'sku' | 'nome'>;
};

export type PedidoResumo = {
  id: number;
  status: 'APROVADO' | 'CANCELADO';
  valorLiquido: number;
  criadoEm: string;
};

export type Pedido = {
  id: number;
  clienteId: number;
  status: 'APROVADO' | 'CANCELADO';
  valorBruto: number;
  valorDesconto: number;
  valorLiquido: number;
  criadoEm: string;
  cliente?: Pick<Cliente, 'id' | 'razaoSocial' | 'cnpj' | 'email' | 'limiteCredito'>;
  itensPedido: ItemPedido[];
};

export type AlertaReposicao = {
  sku: string;
  nome: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  nomeFantasia: string;
  prazoEntrega: number;
};

export type PedidoCriado = {
  pedido: Pick<Pedido, 'id' | 'status' | 'criadoEm' | 'valorBruto' | 'valorDesconto' | 'valorLiquido'>;
  alertasReposicao: AlertaReposicao[];
};

export type PedidoCancelado = {
  pedido: Pedido;
  estorno: { creditoRestaurado: number; itensEstornados: number };
};

export type ErroApi = {
  message: string;
  errors?: Array<{ path: string; message: string }>;
};

export type SeveridadeAviso = 'erro' | 'alerta' | 'sucesso';

export type AvisoTela = {
  titulo?: string;
  mensagem: string;
  severidade: SeveridadeAviso;
};

export type CriarCliente = Pick<Cliente, 'razaoSocial' | 'cnpj' | 'email' | 'telefone' | 'limiteCredito'>;
export type AtualizarCliente = Partial<CriarCliente & Pick<Cliente, 'ativo'>>;
export type CriarFornecedor = Pick<Fornecedor, 'nomeFantasia' | 'cnpj' | 'emailContato' | 'prazoEntrega'>;
export type AtualizarFornecedor = Partial<Pick<Fornecedor, 'nomeFantasia' | 'emailContato' | 'prazoEntrega' | 'ativo'>>;
export type CriarProduto = Pick<Produto, 'sku' | 'nome' | 'precoCusto' | 'precoVenda' | 'estoqueAtual' | 'estoqueMinimo' | 'fornecedorId'>;
export type AtualizarProduto = Partial<CriarProduto>;
export type CriarPedido = {
  clienteId: number;
  itens: Array<{ produtoId: number; quantidade: number }>;
};
