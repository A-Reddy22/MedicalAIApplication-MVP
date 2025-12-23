#!/usr/bin/env node
import net from 'net';
import { spawn } from 'child_process';

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', () => {
        resolve(false);
      })
      .once('listening', () => {
        server.close(() => resolve(true));
      })
      .listen(port, '127.0.0.1');
  });
}

async function findPort(start = 4000, end = 4010) {
  for (let p = start; p <= end; p++) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(p)) return p;
  }

  // fallback: ask OS for an available port
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, () => {
      const addr = s.address();
      const port = addr && typeof addr === 'object' ? addr.port : null;
      s.close(() => {
        if (!port) return reject(new Error('Could not acquire ephemeral port'));
        resolve(port);
      });
    });
    s.on('error', (err) => reject(err));
  });
}

function spawnNpmScript(scriptName, envVars) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCmd, ['run', scriptName], {
    stdio: 'inherit',
    env: { ...process.env, ...envVars },
  });
  return child;
}

(async () => {
  try {
    const port = await findPort(Number(process.env.VITE_API_PORT) || 4000, Number(process.env.VITE_API_PORT) || 4010);
    console.log(`Starting dev servers with API port=${port}`);

    // Start backend via npm script (dev:server) so it uses node backend/index.mjs
    const backend = spawnNpmScript('dev:server', { PORT: String(port), VITE_API_PORT: String(port) });

    // Start frontend via npm script (dev:client) which runs vite
    const frontend = spawnNpmScript('dev:client', { VITE_API_PORT: String(port) });

    function shutdown(signal) {
      console.log(`Received ${signal}, shutting down dev servers...`);
      if (backend && !backend.killed) backend.kill('SIGTERM');
      if (frontend && !frontend.killed) frontend.kill('SIGTERM');
      setTimeout(() => process.exit(0), 500);
    }

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    backend.on('exit', (code, sig) => {
      console.log(`Backend exited with code=${code} signal=${sig}`);
      // if backend exits unexpectedly, kill frontend too
      if (frontend && !frontend.killed) frontend.kill('SIGTERM');
      process.exit(code ?? 0);
    });

    frontend.on('exit', (code, sig) => {
      console.log(`Frontend exited with code=${code} signal=${sig}`);
      if (backend && !backend.killed) backend.kill('SIGTERM');
      process.exit(code ?? 0);
    });
  } catch (err) {
    console.error('Failed to start dev servers:', err);
    process.exit(1);
  }
})();
