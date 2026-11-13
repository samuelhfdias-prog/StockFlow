import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não foi definida. Configure a conexão MySQL no arquivo .env.');
}

let connection: URL;

try {
  connection = new URL(connectionString);
} catch {
  throw new Error('DATABASE_URL inválida. Use o formato mysql://usuario:senha@host:porta/database.');
}

if (connection.protocol !== 'mysql:' || !connection.hostname || !connection.username || !connection.pathname.slice(1)) {
  throw new Error('DATABASE_URL inválida. Informe usuário, host e database no formato mysql://.');
}

let user: string;
let password: string;
let database: string;

try {
  user = decodeURIComponent(connection.username);
  password = decodeURIComponent(connection.password);
  database = decodeURIComponent(connection.pathname.slice(1));
} catch {
  throw new Error('DATABASE_URL contém caracteres inválidos ou não codificados nas credenciais.');
}

const adapter = new PrismaMariaDb({
  host: connection.hostname,
  port: Number(connection.port || 3306),
  user,
  password,
  database,
  connectionLimit: Number.parseInt(process.env.DATABASE_POOL_LIMIT ?? '', 10) || 10,
});

export const prisma = new PrismaClient({ adapter });
