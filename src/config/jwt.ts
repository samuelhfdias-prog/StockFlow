import 'dotenv/config';

const secret = process.env.JWT_SECRET;

if (!secret || secret.startsWith('replace-with-') || Buffer.byteLength(secret) < 32) {
  throw new Error('JWT_SECRET ausente ou fraco. Configure um segredo aleatório com pelo menos 32 bytes no .env.');
}

export const jwtSecret = secret;
