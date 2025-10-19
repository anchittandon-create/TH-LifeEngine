#!/usr/bin/env node
const { spawn } = require("node:child_process");
const net = require("node:net");

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? "3001", 10);
const MAX_OFFSET = 50;

function isPortFree(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE" || err.code === "EACCES" || err.code === "EPERM") {
        resolve(false);
      } else {
        reject(err);
      }
    });
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(startPort) {
  for (let offset = 0; offset <= MAX_OFFSET; offset += 1) {
    const candidate = startPort + offset;
    const free = await isPortFree(candidate);
    if (free) return candidate;
  }
  throw new Error(`No free port found between ${startPort} and ${startPort + MAX_OFFSET}`);
}

(async () => {
  try {
    const port = await findAvailablePort(DEFAULT_PORT);
    process.env.PORT = String(port);
    console.log(`Starting Next.js dev server on port ${port}`);
    const child = spawn("next", ["dev", "-p", String(port)], {
      stdio: "inherit",
      env: process.env,
    });

    const teardown = () => {
      child.kill("SIGTERM");
    };

    process.on("SIGINT", teardown);
    process.on("SIGTERM", teardown);

    child.on("exit", (code) => {
      process.exit(code ?? 0);
    });
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
})();
