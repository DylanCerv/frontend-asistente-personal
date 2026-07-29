/**
 * Frees Metro ports 8081 and 8082 so Expo Go always binds to 8081.
 * Cross-platform (Windows / macOS / Linux).
 */
const { execSync } = require('child_process');

const PORTS = [8081, 8082];

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(
        `netstat -ano | findstr :${port}`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] },
      );
      const pids = new Set();
      for (const line of output.split(/\r?\n/)) {
        if (!line.includes('LISTENING')) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          console.log(`Freed port ${port} (PID ${pid})`);
        } catch {
          // Process may already be gone.
        }
      }
      return;
    }

    const output = execSync(`lsof -ti tcp:${port}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    for (const pid of output.split(/\s+/).filter(Boolean)) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        console.log(`Freed port ${port} (PID ${pid})`);
      } catch {
        // Process may already be gone.
      }
    }
  } catch {
    // Port already free.
  }
}

for (const port of PORTS) {
  killPort(port);
}

console.log('Ports 8081 and 8082 are clear.');
