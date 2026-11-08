process.env.DATABASE_URL ??= 'mysql://root@127.0.0.1:3306/stockflow';
process.env.JWT_SECRET ??= 'vitest-secret-with-at-least-thirty-two-characters';
process.env.CORS_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080';
