import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tsNodeDev = resolve(projectRoot, 'node_modules', 'ts-node-dev', 'lib', 'bin.js');
const server = spawn(
  process.execPath,
  [tsNodeDev, '--respawn', '--transpile-only', 'src/server.ts'],
  {
    cwd: projectRoot,
    env: { ...process.env, OPEN_SWAGGER: process.env.OPEN_SWAGGER ?? 'true' },
    stdio: 'inherit',
  },
);

server.once('error', (error) => {
  console.error(`Não foi possível iniciar o servidor de desenvolvimento: ${error.message}`);
  process.exitCode = 1;
});

server.once('exit', (code) => {
  process.exitCode = code ?? 1;
});

process.once('SIGINT', () => server.kill('SIGINT'));
process.once('SIGTERM', () => server.kill('SIGTERM'));
