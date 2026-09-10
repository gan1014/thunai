import fs from 'fs';
import os from 'os';
import path from 'path';

interface LogEntry {
  timestamp: number;
  label: string;
  elapsedMs?: number;
  cpuPercent?: number;
  memoryMb?: number;
  gpuInfo?: string;
  extra?: Record<string, any>;
}

class MetricsLogger {
  private startTimes: Map<string, bigint> = new Map();
  private logFile: string;

  constructor() {
    const logsDir = path.resolve(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFile = path.join(logsDir, `run_${Date.now()}.jsonl`);
  }

  private nowBigInt(): bigint {
    return process.hrtime.bigint();
  }

  start(label: string): void {
    this.startTimes.set(label, this.nowBigInt());
    this.record(label, { timestamp: Date.now() });
  }

  end(label: string, extra: Record<string, any> = {}): void {
    const start = this.startTimes.get(label);
    if (start) {
      const elapsed = Number(this.nowBigInt() - start) / 1_000_000; // ms
      this.record(label, { timestamp: Date.now(), elapsedMs: elapsed, ...extra });
      this.startTimes.delete(label);
    }
  }

  private record(label: string, data: Partial<LogEntry>) {
    const entry: LogEntry = {
      timestamp: data.timestamp ?? Date.now(),
      label,
      elapsedMs: data.elapsedMs,
      cpuPercent: this.getCpuPercent(),
      memoryMb: this.getMemoryMb(),
      gpuInfo: this.getGpuInfo(),
      extra: data.extra,
    };
    fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
  }

  private getCpuPercent(): number {
    const load = os.loadavg()[0];
    const cpus = os.cpus().length;
    return Math.min(100, (load / cpus) * 100);
  }

  private getMemoryMb(): number {
    const mem = process.memoryUsage().rss;
    return Math.round(mem / (1024 * 1024));
  }

  private getGpuInfo(): string | null {
    try {
      const execSync = require('child_process').execSync;
      const out = execSync('nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader,nounits', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      return out;
    } catch {
      return null;
    }
  }
}

export const metrics = new MetricsLogger();
