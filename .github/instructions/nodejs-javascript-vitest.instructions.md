---
description: "Padrões de Node.js, TypeScript e JavaScript do StockFlow com Vitest"
applyTo: "**/*.{ts,js}"
---

# Diretrizes de Código

## Padrões de implementação
- Use TypeScript e JavaScript conforme a configuração e os padrões existentes do projeto.
- Escreva nomes de classes, funções, variáveis, tipos e mensagens em português claro, seguindo o vocabulário já adotado no código.
- Preserve as camadas e convenções atuais; classes, services e controllers são adequados quando correspondem à arquitetura do repositório.
- Prefira módulos nativos do Node.js e evite dependências externas desnecessárias.
- Use async/await para código assíncrono e APIs baseadas em Promise.
- Mantenha o código simples, tipado e fácil de manter.
- Adicione comentários somente para explicar regras não triviais.
- Para valores opcionais, siga os tipos e padrões já adotados pelo código existente.

## Testes
- Use Vitest quando configurado no projeto.
- Escreva testes para novas funcionalidades e correções, cobrindo casos de borda e falhas.
- Não altere regras de produção apenas para facilitar testes; use dependências substituíveis e mocks quando apropriado.

## Documentação
- Atualize o README.md quando adicionar funcionalidades ou fizer mudanças relevantes.

## Idioma
- Escreva código, comentários, mensagens e documentação em português, respeitando o idioma e o domínio do projeto.
