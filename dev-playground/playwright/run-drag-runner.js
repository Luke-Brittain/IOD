#!/usr/bin/env node
const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const path = require('path');
const os = require('os');

const DEV_DIR = path.resolve(__dirname, '..');
const DEFAULT_HOST = process.env.HOST || '127.0.0.1';
const DEFAULT_PORT = process.env.PORT || '5174';
const START_CMD = process.env.START_CMD || 'pnpm dev -- --host ' + DEFAULT_HOST;
const SCRIPT = process.env.SCRIPT || path.join('playwright', 'run-drag.js');

function waitForUrl(url, timeout = 60_000, interval = 1000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function check() {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.get(url, res => {
        // consider any response as ready
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(check, interval);
      });
      req.setTimeout(2000, () => {
        req.abort();
      });
    })();
  });
}

function spawnServer(cmd, cwd) {
  // spawn via shell for cross-platform compatibility
  const child = spawn(cmd, { cwd, shell: true, detached: true, stdio: 'inherit' });
  // If detached, child.pid is the shell. We'll attempt to kill the group where possible.
  return child;
}

function killProcessTree(child) {
  if (!child || !child.pid) return;
  try {
    if (process.platform === 'win32') {
      // taskkill will terminate the process tree
      spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'inherit' });
    } else {
      // use negative pid to kill the group
      try { process.kill(-child.pid, 'SIGTERM'); } catch (e) { try { process.kill(child.pid, 'SIGTERM'); } catch (_) {} }
    }
  } catch (e) {
    // ignore
  }
}

async function run(options = {}) {
  const host = options.host || DEFAULT_HOST;
  const port = options.port || DEFAULT_PORT;
  const urlCandidates = [`http://${host}:${port}/`, `http://localhost:${port}/`, `http://[::1]:${port}/`];

  console.log('Starting dev server:', START_CMD);
  const server = spawnServer(START_CMD, DEV_DIR);

  let ready = false;
  for (const u of urlCandidates) {
    try {
      await waitForUrl(u, 15000, 1000);
      console.log('HTTP_OK', u);
      ready = true;
      break;
    } catch (_) {
      // try next
    }
  }

  if (!ready) {
    console.error('server did not become ready on any address');
    killProcessTree(server);
    process.exitCode = 2;
    return;
  }

  console.log('Running script:', SCRIPT);
  const run = spawn(process.execPath, [SCRIPT], { cwd: DEV_DIR, shell: false, stdio: 'inherit' });
  const exitCode = await new Promise(resolve => run.on('exit', resolve));

  // cleanup
  killProcessTree(server);
  process.exitCode = exitCode || 0;
}

if (require.main === module) {
  const opts = {};
  run(opts).catch(err => {
    console.error(err);
    process.exit(1);
  });
} else {
  module.exports = { run };
}
