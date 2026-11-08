import { spawn } from 'node:child_process';
import 'dotenv/config';
import app from './app';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';

app.listen(port, host, () => {
  const swaggerUrl = `http://127.0.0.1:${port}/api-docs/`;
  console.log(`StockFlow API disponível em http://${host}:${port}.`);

  if (process.env.OPEN_SWAGGER !== 'true') {
    return;
  }

  const browserProcess = process.platform === 'win32'
    ? spawn('rundll32.exe', ['url.dll,FileProtocolHandler', swaggerUrl], { detached: true, stdio: 'ignore' })
    : process.platform === 'darwin'
      ? spawn('open', [swaggerUrl], { detached: true, stdio: 'ignore' })
      : process.platform === 'linux'
        ? spawn('xdg-open', [swaggerUrl], { detached: true, stdio: 'ignore' })
        : undefined;

  if (!browserProcess) {
    console.error(`A abertura automática do Swagger não é compatível com ${process.platform}.`);
    return;
  }

  browserProcess.once('error', (error) => {
    console.error(`Não foi possível abrir o Swagger automaticamente: ${error.message}`);
  });
  browserProcess.unref();
});
