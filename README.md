# StockFlow B2B API

Repository initialization.

## MySQL local

1. Crie o database `stockflow` no MySQL:

   ```sql
   CREATE DATABASE stockflow;
   ```

2. Copie `.env.example` para `.env` e ajuste `DATABASE_URL` com a senha do MySQL. O `.env` é ignorado pelo Git. Para uma conta root sem senha, use `mysql://root@127.0.0.1:3306/stockflow`. Codifique caracteres especiais da senha como URL encoding.
3. Gere um segredo JWT aleatório com pelo menos 32 bytes e substitua o valor de exemplo de `JWT_SECRET` no `.env`:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

4. Instale as dependências e gere o cliente Prisma:

   ```powershell
   npm install
   npm run prisma:generate
   npm run db:push
   ```

5. Inicie o servidor local:

   ```powershell
   npm run dev
   ```

   No desenvolvimento, o comando abre o Swagger em `http://127.0.0.1:3000/api-docs/`. O `npm start` não tenta abrir um navegador.

Use uma conta MySQL dedicada e com privilégios mínimos fora do ambiente local de demonstração. Nunca versione o arquivo `.env` nem compartilhe sua senha.

O Swagger está inicializado e documenta os endpoints de autenticação em `/api-docs/`.
