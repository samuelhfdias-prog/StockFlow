export type ItemSimulacao = { precoVenda: number; quantidade: number };

export const emCentavos = (valor: number) => Math.round(valor * 100);
export const deCentavos = (centavos: number) => centavos / 100;

// Espelha PedidoService.calcularDesconto da API, mas em centavos inteiros para não herdar o erro de ponto flutuante do JavaScript.
export const simularPedido = (itens: ItemSimulacao[]) => {
  const totalUnidades = itens.reduce((soma, item) => soma + item.quantidade, 0);
  const brutoCentavos = itens.reduce((soma, item) => soma + emCentavos(item.precoVenda) * item.quantidade, 0);
  const taxaPercentual = totalUnidades >= 30 || brutoCentavos > 700_000
    ? 10
    : totalUnidades >= 10 || brutoCentavos > 250_000
      ? 5
      : 0;
  const descontoCentavos = Math.floor((brutoCentavos * taxaPercentual + 50) / 100);

  return {
    totalUnidades,
    taxaPercentual,
    bruto: deCentavos(brutoCentavos),
    desconto: deCentavos(descontoCentavos),
    liquido: deCentavos(brutoCentavos - descontoCentavos),
    liquidoCentavos: brutoCentavos - descontoCentavos,
  };
};

// Envia no PUT somente o que o usuário mudou, para não sobrescrever estoque ou crédito alterados por pedidos enquanto o formulário estava aberto.
export const apenasAlterados = <T extends object>(original: T, editado: T): Partial<T> => {
  const alterados: Partial<T> = {};

  for (const chave of Object.keys(editado) as Array<keyof T>) {
    if (editado[chave] !== original[chave]) alterados[chave] = editado[chave];
  }

  return alterados;
};
