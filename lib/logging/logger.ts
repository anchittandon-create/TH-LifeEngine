export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  userId?: string;
  profileId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

const logs: LogEntry[] = [];

export class Logger {
  private userId?: string;
  private profileId?: string;

  constructor(userId?: string, profileId?: string) {
    this.userId = userId;
    this.profileId = profileId;
  }

  private log(level: LogEntry['level'], message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      userId: this.userId,
      profileId: this.profileId,
      metadata
    };

    logs.push(entry);

    // Keep only last 1000 logs in memory
    if (logs.length > 1000) {
      logs.shift();
    }

    // Console output with color
    const colors = {
      info: '\x1b[36m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      debug: '\x1b[90m'
    };
    const reset = '\x1b[0m';
    console.log(
      `${colors[level]}[${level.toUpperCase()}]${reset} ${entry.timestamp} - ${message}`,
      metadata ? JSON.stringify(metadata) : ''
    );

    return entry;
  }

  info(message: string, metadata?: Record<string, any>) {
    return this.log('info', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    return this.log('warn', message, metadata);
  }

  error(message: string, metadata?: Record<string, any>) {
    return this.log('error', message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>) {
    return this.log('debug', message, metadata);
  }

  static getLogs(limit = 100): LogEntry[] {
    return logs.slice(-limit);
  }

  static getLogsByUser(userId: string, limit = 100): LogEntry[] {
    return logs.filter(log => log.userId === userId).slice(-limit);
  }

  static getLogsByProfile(profileId: string, limit = 100): LogEntry[] {
    return logs.filter(log => log.profileId === profileId).slice(-limit);
  }

  static clearLogs() {
    logs.length = 0;
  }
}

export const systemLogger = new Logger('system');
