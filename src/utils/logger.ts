interface LogEntry {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  source?: string;
  timestamp?: string;
}

class Logger {
  private logServerUrl = 'http://localhost:3001/log';
  private isServerAvailable = true;

  private async sendToServer(entry: LogEntry): Promise<void> {
    if (!this.isServerAvailable) return;

    try {
      const response = await fetch(this.logServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          timestamp: entry.timestamp || new Date().toISOString(),
          source: entry.source || 'browser'
        })
      });

      if (!response.ok) {
        this.isServerAvailable = false;
        console.warn('Log server not available, falling back to console only');
      }
    } catch (error) {
      this.isServerAvailable = false;
      console.warn('Log server not available, falling back to console only');
    }
  }

  private logInternal(level: LogEntry['level'], message: string, data?: any, source?: string): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      source: source || 'app'
    };

    // Always log to console
    const consoleMethod = console[level] || console.log;
    if (data) {
      consoleMethod(`[${entry.source}] ${message}`, data);
    } else {
      consoleMethod(`[${entry.source}] ${message}`);
    }

    // Send to server
    this.sendToServer(entry);
  }

  log(message: string, data?: any, source?: string): void {
    this.logInternal('log', message, data, source);
  }

  info(message: string, data?: any, source?: string): void {
    this.logInternal('info', message, data, source);
  }

  warn(message: string, data?: any, source?: string): void {
    this.logInternal('warn', message, data, source);
  }

  error(message: string, data?: any, source?: string): void {
    this.logInternal('error', message, data, source);
  }

  debug(message: string, data?: any, source?: string): void {
    this.logInternal('debug', message, data, source);
  }
}

// Create singleton instance
export const logger = new Logger();

// Export logger for manual use - no console override to avoid recursion
