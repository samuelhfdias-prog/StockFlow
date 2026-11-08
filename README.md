# StockFlow B2B API

API REST para gestão de estoque e pedidos comerciais atacadistas. O sistema mantém clientes, fornecedores, produtos, pedidos e seus itens, aplicando regras de crédito, disponibilidade de estoque, descontos por volume e histórico comercial.

## Tecnologias

- Node.js e TypeScript
- Express 5
- Prisma ORM 7 com MySQL/MariaDB
- Zod para validação de payloads e filtros
- JWT para autenticação Bearer e bcryptjs para hashes de senha
- Helmet e CORS para proteções HTTP básicas
- Swagger UI em `/api-docs/`

## Arquitetura

O código é separado por responsabilidade:

- `src/routes/`: mapeia método e caminho HTTP e compõe middlewares/controllers.
- `src/middlewares/`: autentica JWT, valida corpo com Zod e trata erros globais.
- `src/controllers/`: extrai dados da requisição e define a resposta/status HTTP.
- `src/services/`: aplica as regras de negócio e coordena as operações.
- `src/repositories/`: encapsula consultas e gravações do Prisma. Transações de negócio complexas ficam nos services.
- `src/schemas/`: define contratos e validações de entrada usando Zod.
- `src/errors/`: contém `AppError`, que associa uma mensagem a um status HTTP.
- `src/database/`: instancia o Prisma Client com o adapter MySQL.
- `prisma/schema.prisma`: define os seis modelos relacionais e mapeia tabelas/colunas para snake_case.

O `errorHandler`, registrado depois das rotas em `src/app.ts`, converte `AppError` em respostas com o status apropriado, erros Zod e JSON inválido em HTTP 400, e demais falhas em HTTP 500 sem expor detalhes internos.

## Instalação e configuração local

Requisitos: Node.js compatível com as dependências do projeto e MySQL/MariaDB disponível.

1. Crie o database:

   ```sql
   CREATE DATABASE stockflow;
   ```

2. Copie `.env.example` para `.env` e configure `DATABASE_URL` com usuário, senha, host, porta e database. Exemplo local:

   ```env
   DATABASE_URL="mysql://root:SUA_SENHA@127.0.0.1:3306/stockflow"
   PORT=3000
   HOST=127.0.0.1
   CORS_ORIGINS=http://localhost:3000
   JWT_SECRET="SEGREDO_ALEATORIO_COM_PELO_MENOS_32_BYTES"
   ```

   Gere um segredo JWT para desenvolvimento:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   Copie o valor gerado para `JWT_SECRET`. O valor de exemplo de `.env.example` é um placeholder e não permite iniciar a configuração JWT. Codifique caracteres especiais da senha do MySQL em URL encoding. O `.env` é ignorado pelo Git; não compartilhe nem versione credenciais.

3. Instale dependências, gere o cliente Prisma e crie/aplique a migration inicial:

   ```powershell
   npm install
   npm run prisma:generate
   npx prisma migrate dev --name init
   ```

   Para sincronização rápida em banco de desenvolvimento sem criar migration, existe também:

   ```powershell
   npm run db:push
   ```

   Use migrations versionadas nos fluxos compartilhados e de produção; `db:push` é uma conveniência para desenvolvimento local.

4. Inicie a API:

   ```powershell
   npm run dev
   ```

   O servidor de desenvolvimento abre o Swagger automaticamente em `http://127.0.0.1:3000/api-docs/`. Para compilar e executar o build:

   ```powershell
   npm run build
   npm start
   ```

### Seed e primeiro acesso

O repositório não possui um script de seed automático. Para preparar dados de demonstração, use o Swagger:

1. Chame `POST /auth/registrar` para criar o primeiro usuário `OPERADOR`.
2. Faça login em `POST /auth/login` e use o token retornado no botão **Authorize** do Swagger.
3. Crie um fornecedor com `POST /fornecedores` e um cliente com `POST /clientes`.
4. Crie produtos vinculados ao fornecedor ativo usando `POST /produtos`.
5. Use esses registros para testar consultas e pedidos.

O cadastro público não permite criar `ADMIN`; a criação de contas administrativas requer um fluxo de provisionamento controlado, fora da rota pública.

## Endpoints REST

Rotas marcadas como protegidas exigem `Authorization: Bearer <token>`. Os detalhes de payloads, parâmetros e respostas estão no Swagger.

| # | Método e rota | Acesso | Descrição |
|---:|---|---|---|
| 01 | `POST /auth/registrar` | Público | Cadastra usuário operador, valida e-mail e grava senha com bcrypt. |
| 02 | `POST /auth/login` | Público | Valida credenciais e emite JWT com validade de 8 horas. |
| 03 | `POST /clientes` | Protegido | Cadastra cliente B2B e limite de crédito inicial; CNPJ/e-mail são únicos. |
| 04 | `GET /clientes` | Protegido | Lista clientes com filtros opcionais `ativo` e `razaoSocial`. |
| 05 | `GET /clientes/:id` | Protegido | Consulta cliente e resumo dos pedidos vinculados. |
| 06 | `PUT /clientes/:id` | Protegido | Atualiza dados, status e limite, mantendo unicidade de CNPJ/e-mail. |
| 07 | `DELETE /clientes/:id` | Protegido | Exclui apenas cliente sem pedidos; cadastro com histórico deve ser inativado. |
| 08 | `POST /fornecedores` | Protegido | Homologa fornecedor com CNPJ único e prazo de entrega em dias. |
| 09 | `GET /fornecedores` | Protegido | Lista fornecedores com contagem de produtos em `_count.produtos`. |
| 10 | `GET /fornecedores/:id` | Protegido | Consulta fornecedor e produtos vinculados. |
| 11 | `PUT /fornecedores/:id` | Protegido | Atualiza contato, prazo de entrega e situação ativa. |
| 12 | `DELETE /fornecedores/:id` | Protegido | Exclui somente fornecedor sem produtos vinculados. |
| 13 | `POST /produtos` | Protegido | Cadastra produto com SKU único, margem positiva e fornecedor ativo. |
| 14 | `GET /produtos` | Protegido | Lista produtos, filtra por `fornecedorId` e/ou `estoqueCritico=true`. |
| 15 | `GET /produtos/:id` | Protegido | Consulta produto, fornecedor, margem percentual e estoque crítico. |
| 16 | `PUT /produtos/:id` | Protegido | Atualiza dados do produto, preservando SKU e margem válida. |
| 17 | `DELETE /produtos/:id` | Protegido | Exclui apenas produto sem vínculo com itens de pedidos. |
| 18 | `POST /pedidos` | Protegido | Processa pedido em transação: valida cliente, estoque e crédito, calcula desconto, baixa saldo e emite alertas. |
| 19 | `GET /pedidos/:id` | Protegido | Consulta espelho financeiro, cliente e itens com SKU/nome. |
| 20 | `PATCH /pedidos/:id/cancelar` | Protegido | Cancela pedido aprovado e estorna estoque e crédito em transação. |

## Regras de negócio transacionais

### Criação de pedidos — `POST /pedidos`

O pedido deve conter cliente e ao menos um item com produto e quantidade inteira positiva. O service executa as etapas abaixo dentro de `prisma.$transaction`:

1. Busca o cliente; cliente ausente retorna 404 e cliente inativo retorna 403.
2. Busca os produtos em lote e agrega quantidades repetidas do mesmo produto para conferir saldo total. Produto ausente retorna 404; estoque insuficiente retorna 422 identificando o SKU.
3. Calcula o valor bruto com o preço de venda registrado para cada produto e aplica o desconto progressivo:
   - 10% se o volume total for pelo menos 30 unidades **ou** o valor bruto superar R$ 7.000.
   - Caso contrário, 5% se o volume for pelo menos 10 unidades **ou** o valor bruto superar R$ 2.500.
   - Caso contrário, não há desconto.
4. Compara o valor líquido com o crédito disponível do cliente; insuficiência retorna 422.
5. Baixa o estoque com atualização condicional de saldo e reduz o crédito disponível, também de forma condicional, protegendo contra compras concorrentes.
6. Grava pedido aprovado e itens com preço/subtotal faturado. Produtos que atingem ou ficam abaixo do estoque mínimo geram alerta com SKU, nome, saldo, fornecedor e prazo de entrega.

Qualquer erro aborta a transação: pedido, itens, estoque e crédito permanecem sem alterações parciais.

### Cancelamento — `PATCH /pedidos/:id/cancelar`

Somente pedidos em `APROVADO` podem ser cancelados. A transação altera condicionalmente o status para `CANCELADO`, devolve as quantidades dos itens ao estoque e recompõe no cliente o valor líquido faturado. O status condicional impede dois cancelamentos simultâneos de realizarem estornos duplicados. Se qualquer atualização falhar, toda a transação é revertida. Um pedido já cancelado retorna 409.

## Segurança e execução

- Senhas são armazenadas como hashes bcrypt, não em texto puro.
- `JWT_SECRET` é obrigatório e deve ser privado e aleatório; o token contém somente claims necessárias à autenticação.
- CORS usa a lista `CORS_ORIGINS`; sem origens configuradas, não libera acesso cross-origin.
- Helmet define cabeçalhos de segurança e o parser JSON tem limite de tamanho.
- Use conta MySQL com privilégios mínimos fora da máquina de desenvolvimento.
- Não exponha stack traces, SQL, senhas ou tokens em respostas e logs compartilhados.
