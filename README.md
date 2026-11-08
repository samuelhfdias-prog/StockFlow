# StockFlow B2B API

## MySQL local

1. Crie o database `stockflow` no MySQL:

   ```sql
   CREATE DATABASE stockflow;
   ```

2. Copie `.env.example` para `.env` e ajuste `DATABASE_URL` com a senha do MySQL. O `.env` é ignorado pelo Git. Para uma conta root sem senha, use `mysql://root@127.0.0.1:3306/stockflow`. Codifique caracteres especiais da senha como URL encoding.
3. Instale as dependências e gere o cliente Prisma:

   ```powershell
   npm install
   npm run prisma:generate
   npm run db:push
   ```

4. Inicie o servidor local:

   ```powershell
   npm run dev
   ```

   No desenvolvimento, o comando abre o Swagger em `http://127.0.0.1:3000/api-docs/`. O `npm start` não tenta abrir um navegador.

Use uma conta MySQL dedicada e com privilégios mínimos fora do ambiente local de demonstração. Nunca versione o arquivo `.env` nem compartilhe sua senha.

O Swagger está inicializado; as operações da API aparecerão quando seus endpoints forem implementados.
