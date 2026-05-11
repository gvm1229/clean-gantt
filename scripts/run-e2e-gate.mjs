import { spawn, spawnSync } from "node:child_process";
import { rmSync } from "node:fs";

const pnpm = "pnpm";
const port = Number(process.env.E2E_PORT ?? 3101);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;
const env = Object.fromEntries(
  Object.entries({
    ...process.env,
    AUTH_SECRET:
      process.env.AUTH_SECRET || "e2e-only-secret-do-not-use-in-production",
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST || "true",
    E2E_BASE_URL: baseURL,
    E2E_PORT: String(port),
  }).filter((entry) => entry[1] !== undefined),
);

function windowsCommand(args) {
  return [pnpm, ...args].join(" ");
}

function run(args, extraEnv = {}) {
  const result =
    process.platform === "win32"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", windowsCommand(args)], {
          env: { ...env, ...extraEnv },
          stdio: "inherit",
        })
      : spawnSync(pnpm, args, {
          env: { ...env, ...extraEnv },
          stdio: "inherit",
        });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `[e2e-gate] pnpm ${args.join(" ")} failed with status ${result.status ?? 1}`,
    );
  }
}

function startServer() {
  const args = ["exec", "next", "start", "-p", String(port)];
  return process.platform === "win32"
    ? spawn("cmd.exe", ["/d", "/s", "/c", windowsCommand(args)], {
        env,
        stdio: "inherit",
      })
    : spawn(pnpm, args, {
        env,
        stdio: "inherit",
      });
}

let stoppingServer = false;

function stopServer(server) {
  if (server.killed || server.exitCode !== null) return;

  stoppingServer = true;

  if (process.platform === "win32" && server.pid) {
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    return;
  }

  server.kill();
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `[e2e-gate] server did not become ready at ${url}: ${lastError}`,
  );
}

rmSync(".next", { recursive: true, force: true });
run(["build"]);

const server = startServer();
let serverExited = false;
server.on("exit", (code, signal) => {
  serverExited = true;
  if (stoppingServer) return;
  if (code !== null && code !== 0) {
    console.error(`[e2e-gate] next start exited with code ${code}`);
  }
  if (signal) {
    console.error(`[e2e-gate] next start exited via signal ${signal}`);
  }
});

try {
  await waitForServer(baseURL);
  if (serverExited) {
    throw new Error("[e2e-gate] next start exited before tests could run");
  }
  run(["exec", "playwright", "test", "--project=chromium"], {
    E2E_SKIP_WEB_SERVER: "1",
  });
} finally {
  stopServer(server);
}
