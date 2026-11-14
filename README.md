# StockFlow B2B API

Aplicação Full-Stack para gestão de estoque e pedidos comerciais atacadistas. A API concentra autenticação, cadastros, catálogo, crédito e processamento transacional de pedidos; a interface web permite que a equipe execute esses fluxos em um único painel.

## Tecnologias

### API

- Node.js 22, TypeScript e Express 5
- Prisma ORM 7 com MySQL/MariaDB e adapter `@prisma/adapter-mariadb`
- Zod 4, JWT e bcryptjs
- Helmet, CORS e Swagger UI
- Vitest e Supertest para testes sem acesso ao banco

### Interface web

- React 19, Vite 7 e TypeScript em modo estrito
- TailwindCSS e Lucide React
- React Router

### Operação

- Docker e Docker Compose
- MySQL fornecido pela máquina host; o Compose não inicia um segundo banco

## Arquitetura

A API está organizada por responsabilidade:

- `src/routes/`: caminhos HTTP e composição de middlewares/controllers.
- `src/middlewares/`: autenticação Bearer JWT, validação Zod e tratamento global de erros.
- `src/controllers/`: extração de parâmetros/body e respostas HTTP.
- `src/services/`: regras de negócio e coordenação das operações.
- `src/repositories/`: acesso ao Prisma/MySQL.
- `src/schemas/`: contratos e validações Zod.
- `src/database/`: configuração do Prisma Client e adapter MySQL.
- `prisma/schema.prisma`: seis modelos relacionais com mapeamento snake_case.
- `frontend/src/tipos/`: contratos TypeScript usados pela interface.
- `frontend/src/servicos/api.ts`: chamadas autenticadas à API e tratamento de erros.
- `frontend/src/contextos/`: estado da sessão e usuário autenticado.
- `frontend/src/paginas/` e `frontend/src/componentes/`: telas e elementos reutilizáveis.

Controllers não acessam o Prisma. Para operações que precisam alterar várias tabelas de forma indivisível, `PedidoService` abre a `prisma.$transaction` e repassa o cliente transacional (`tx`) ao `PedidoRepository`, que executa todas as leituras e gravações dentro da mesma transação.

## Pré-requisitos

- Node.js 22 ou compatível com as versões instaladas.
- MySQL/MariaDB acessível em `127.0.0.1:3306`.
- Database `stockflow` criado no servidor MySQL.
- Para execução em containers: Docker Engine/Desktop com Docker Compose disponível.

O serviço MySQL deve estar iniciado antes de usar a API. Em execução via Docker, `host.docker.internal` aponta para a máquina host.

## Execução local

### 1. Configure o banco e variáveis

Crie o database no MySQL:

```sql
CREATE DATABASE stockflow;
```

Copie `.env.example` para `.env` e ajuste as credenciais:

```env
DATABASE_URL="mysql://root:SUA_SENHA@127.0.0.1:3306/stockflow"
PORT=3000
HOST=127.0.0.1
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080
JWT_SECRET="SEGREDO_ALEATORIO_COM_PELO_MENOS_32_BYTES"
# Opcional: conexões simultâneas com o MySQL (padrão 10)
DATABASE_POOL_LIMIT=10
```

Gere um segredo JWT local aleatório:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

O `.env` não é versionado. Nunca publique senhas ou segredos. Caracteres especiais da senha MySQL precisam estar em URL encoding. A URL sem senha `mysql://root@127.0.0.1:3306/stockflow` é aceita se a conta local realmente usar senha vazia.

### 2. Instale e inicialize a API

```powershell
npm install
npm run prisma:generate
npm run db:push
npm run dev
```

`npm run dev` inicia a API e abre o Swagger em `http://127.0.0.1:3000/api-docs/`. A interface web pode ser iniciada em outro terminal:

```powershell
Set-Location frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Vite estará em `http://localhost:5173`. A variável `VITE_API_URL` pode apontar para outra URL, mas seu valor é incorporado ao bundle do navegador.

### 3. Primeiro acesso e dados de demonstração

O projeto não inclui um seed automático. Para iniciar sem inserir credenciais administrativas no código:

1. Use `POST /auth/registrar` no Swagger para criar um operador.
2. Entre em `POST /auth/login` ou na tela `/login`.
3. Use a interface ou o Swagger autorizado para criar fornecedores, clientes e produtos.
4. A tela de pedidos permite simular descontos, confirmar limite disponível e visualizar alertas de ressuprimento.

O registro público cria apenas `OPERADOR`; a criação de administradores deve ser provisionada por um fluxo controlado.

## Testes e builds

Os testes da API usam mocks/repositórios em memória e não conectam nem gravam no MySQL:

```powershell
npm run prisma:generate
npm run build
npm test
```

O comando `npm test` executa verificação de tipos dos testes e a suíte Vitest. Para compilar o front:

```powershell
Set-Location frontend
npm run build
```

## Execução com Docker

1. Garanta que o MySQL da máquina host esteja ativo e que o database `stockflow` exista.
2. Configure `.env` na raiz com `JWT_SECRET`. Para MySQL sem senha, o Compose usa:

   ```text
   mysql://root@host.docker.internal:3306/stockflow
   ```

   Se o usuário root tiver senha, configure `DATABASE_URL_DOCKER` no `.env`, por exemplo:

   ```env
   DATABASE_URL_DOCKER="mysql://root:SUA_SENHA@host.docker.internal:3306/stockflow"
   ```

3. Sincronize o schema do banco host a partir da máquina:

   ```powershell
   npm run prisma:generate
   npm run db:push
   ```

4. Construa e inicie API e interface:

   ```powershell
   docker compose up --build
   ```

5. Acesse:
   - Front-end: `http://localhost:8080`
   - API: `http://localhost:3000`
   - Swagger: `http://localhost:3000/api-docs/`

O container da API usa `HOST=0.0.0.0`, `PORT=3000` e `OPEN_SWAGGER=false`. O front-end é servido pelo Nginx com fallback de SPA. O Compose publica apenas a API e o front; o MySQL continua sendo o servidor da máquina host.

Para encerrar:

```powershell
docker compose down
```

## Endpoints REST

As rotas abaixo são protegidas por `Authorization: Bearer <JWT>`, salvo os endpoints de login e registro. Os contratos completos e exemplos estão no Swagger.

| # | Método e rota | Descrição |
|---:|---|---|
| 01 | `POST /auth/registrar` | Cadastra operador e armazena hash bcrypt. |
| 02 | `POST /auth/login` | Valida credenciais e emite JWT de 8 horas. |
| — | `GET /auth/me` | Retorna os dados básicos da sessão autenticada. |
| 03 | `POST /clientes` | Cadastra cliente e limite de crédito inicial. |
| 04 | `GET /clientes` | Lista clientes com filtros `ativo` e `razaoSocial`. |
| 05 | `GET /clientes/:id` | Consulta cliente e resumo de pedidos. |
| 06 | `PUT /clientes/:id` | Atualiza cadastro, status e crédito. |
| 07 | `DELETE /clientes/:id` | Exclui apenas clientes sem pedidos. |
| 08 | `POST /fornecedores` | Homologa fornecedor com CNPJ único. |
| 09 | `GET /fornecedores` | Lista fornecedores com contagem de produtos. |
| 10 | `GET /fornecedores/:id` | Consulta fornecedor e catálogo vinculado. |
| 11 | `PUT /fornecedores/:id` | Atualiza contato, prazo e status. |
| 12 | `DELETE /fornecedores/:id` | Exclui somente fornecedor sem produtos. |
| 13 | `POST /produtos` | Cadastra produto com margem mínima de 20% sobre o custo e fornecedor ativo. |
| 14 | `GET /produtos` | Lista produtos por fornecedor e estoque crítico. |
| 15 | `GET /produtos/:id` | Consulta ficha, margem e sinalização de estoque. |
| 16 | `PUT /produtos/:id` | Atualiza produto validando SKU e, quando o preço muda, a margem mínima de 20%. |
| 17 | `DELETE /produtos/:id` | Impede excluir produto presente no histórico de pedidos. |
| 18 | `POST /pedidos` | Processa pedido, descontos, estoque, crédito e alertas. |
| — | `GET /pedidos` | Lista pedidos com filtros `status` e `clienteId`. |
| 19 | `GET /pedidos/:id` | Retorna espelho financeiro, cliente e itens. |
| 20 | `PATCH /pedidos/:id/cancelar` | Cancela pedido aprovado e estorna estoque/crédito. |

## Regras comerciais transacionais

### Criação de pedido

`POST /pedidos` executa todas as etapas em uma transação atômica: valida cliente ativo; carrega produtos em lote; agrega linhas duplicadas do mesmo produto para conferir saldo; calcula preços e desconto progressivo; confirma crédito disponível; baixa estoque e limite com atualizações condicionais; grava pedido/itens; e retorna alertas quando o saldo pós-venda fica menor ou igual ao mínimo. Qualquer falha reverte todas as alterações.

Descontos:

- 10% se o pedido tiver pelo menos 30 unidades ou valor bruto acima de R$ 7.000.
- Caso contrário, 5% se tiver pelo menos 10 unidades ou valor bruto acima de R$ 2.500.
- Caso contrário, sem desconto.

Valores monetários são calculados com `Prisma.Decimal`; a API converte os objetos Decimal em números JSON no middleware de serialização.

### Cancelamento de pedido

`PATCH /pedidos/:id/cancelar` só permite pedidos `APROVADO`. Dentro de outra transação, muda o status condicionalmente para impedir estorno duplicado, devolve as quantidades ao estoque e recompõe o crédito pelo valor líquido faturado. Um erro em qualquer etapa desfaz status, estoque e crédito juntos.

### Margem de lucro dos produtos

O preço de venda precisa ser, no mínimo, 20% acima do preço de custo (`venda >= custo × 1,20`); caso contrário `POST /produtos` e `PUT /produtos/:id` respondem `422`. No `PUT` a margem só é reavaliada quando `precoCusto` ou `precoVenda` fazem parte da alteração. `GET /produtos/:id` devolve `margemLucroPercentual`, calculada sobre o custo com `Prisma.Decimal` e arredondamento `ROUND_HALF_UP` em duas casas.

### Validações e erros

Mensagens de validação do Zod saem em português com status `400`. Valores monetários aceitam no máximo duas casas decimais e `R$ 99.999.999,99`, textos até 191 caracteres e inteiros até 2.147.483.647, respeitando as colunas do MySQL. Corpos acima de 100 KB respondem `413` e rotas inexistentes respondem `404` em JSON.

## Segurança e limitações conhecidas

- Use senha MySQL e segredo JWT fortes; não mantenha credenciais reais em `.env.example`.
- Contas públicas registradas não podem definir cargo `ADMIN`.
- CORS aceita as origens configuradas em `CORS_ORIGINS`; as quatro origens de desenvolvimento/container vêm como padrão.
- A aplicação não cria um container MySQL; Docker conecta ao banco que já está rodando na máquina host.
- Para produção, configure usuário MySQL com privilégios mínimos, HTTPS, segredo JWT próprio e migrations revisadas.
