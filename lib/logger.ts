/**
 * Centralized logging utility for Open Researcher
 * Provides structured logging with different levels and sections
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogSection = 'api' | 'agent' | 'firecrawl' | 'openrouter' | 'anthropic' | 'auth' | 'system';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  section: LogSection;
  message: string;
  data?: Record<string, unknown>;
  error?: Error | string;
  requestId?: string;
  duration?: number;
}

// Color codes for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
} as const;

// Section colors for easy identification
const SECTION_COLORS: Record<LogSection, string> = {
  api: COLORS.blue,
  agent: COLORS.magenta,
  firecrawl: COLORS.yellow,
  openrouter: COLORS.green,
  anthropic: COLORS.cyan,
  auth: COLORS.red,
  system: COLORS.white,
};

// Level colors
const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: COLORS.dim,
  info: COLORS.green,
  warn: COLORS.yellow,
  error: COLORS.red,
};

// Log level priority (lower = more verbose)
const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Get current log level from environment
function getMinLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
  if (envLevel && LEVEL_PRIORITY[envLevel] !== undefined) {
    return envLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

// In-memory log buffer for recent logs (useful for debugging)
const LOG_BUFFER_SIZE = 100;
const logBuffer: LogEntry[] = [];

function addToBuffer(entry: LogEntry) {
  logBuffer.push(entry);
  if (logBuffer.length > LOG_BUFFER_SIZE) {
    logBuffer.shift();
  }
}

// Generate a unique request ID
let requestIdCounter = 0;
export function generateRequestId(): string {
  requestIdCounter++;
  return `req-${Date.now()}-${requestIdCounter.toString(36)}`;
}

// Format log entry for console output
function formatLogEntry(entry: LogEntry, useColors: boolean = true): string {
  const timestamp = entry.timestamp;
  const level = entry.level.toUpperCase().padEnd(5);
  const section = entry.section.toUpperCase().padEnd(10);
  
  if (useColors) {
    const levelColor = LEVEL_COLORS[entry.level];
    const sectionColor = SECTION_COLORS[entry.section];
    
    let output = `${COLORS.dim}[${timestamp}]${COLORS.reset} `;
    output += `${levelColor}${level}${COLORS.reset} `;
    output += `${sectionColor}[${section}]${COLORS.reset} `;
    output += entry.message;
    
    if (entry.requestId) {
      output += ` ${COLORS.dim}(${entry.requestId})${COLORS.reset}`;
    }
    
    if (entry.duration !== undefined) {
      output += ` ${COLORS.cyan}${entry.duration}ms${COLORS.reset}`;
    }
    
    return output;
  }
  
  let output = `[${timestamp}] ${level} [${section}] ${entry.message}`;
  if (entry.requestId) output += ` (${entry.requestId})`;
  if (entry.duration !== undefined) output += ` ${entry.duration}ms`;
  return output;
}

// Main logging function
function log(
  level: LogLevel,
  section: LogSection,
  message: string,
  options?: {
    data?: Record<string, unknown>;
    error?: Error | string;
    requestId?: string;
    duration?: number;
  }
) {
  const minLevel = getMinLogLevel();
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minLevel]) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    section,
    message,
    ...options,
  };

  addToBuffer(entry);

  // Format the log message
  const formattedMessage = formatLogEntry(entry, process.env.NODE_ENV !== 'production');

  // Output to console
  switch (level) {
    case 'debug':
      console.debug(formattedMessage);
      break;
    case 'info':
      console.info(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'error':
      console.error(formattedMessage);
      break;
  }

  // Log additional data if present
  if (options?.data && Object.keys(options.data).length > 0) {
    const dataStr = JSON.stringify(options.data, null, 2);
    if (level === 'debug' || level === 'info') {
      console.log(`  ${COLORS.dim}Data: ${dataStr}${COLORS.reset}`);
    } else {
      console.log(`  Data: ${dataStr}`);
    }
  }

  // Log error details if present
  if (options?.error) {
    const errorStr = options.error instanceof Error 
      ? `${options.error.message}\n${options.error.stack}` 
      : options.error;
    console.log(`  ${COLORS.red}Error: ${errorStr}${COLORS.reset}`);
  }
}

// Section-specific loggers
function createSectionLogger(section: LogSection) {
  return {
    debug: (message: string, options?: Parameters<typeof log>[3]) => 
      log('debug', section, message, options),
    info: (message: string, options?: Parameters<typeof log>[3]) => 
      log('info', section, message, options),
    warn: (message: string, options?: Parameters<typeof log>[3]) => 
      log('warn', section, message, options),
    error: (message: string, options?: Parameters<typeof log>[3]) => 
      log('error', section, message, options),
  };
}

// Export section loggers
export const logger = {
  api: createSectionLogger('api'),
  agent: createSectionLogger('agent'),
  firecrawl: createSectionLogger('firecrawl'),
  openrouter: createSectionLogger('openrouter'),
  anthropic: createSectionLogger('anthropic'),
  auth: createSectionLogger('auth'),
  system: createSectionLogger('system'),
  
  // Get recent logs (for debugging/monitoring)
  getRecentLogs: () => [...logBuffer],
  
  // Clear log buffer
  clearBuffer: () => { logBuffer.length = 0; },
  
  // Performance timing helper
  startTimer: (label: string): (() => number) => {
    const start = performance.now();
    return () => {
      const duration = Math.round(performance.now() - start);
      return duration;
    };
  },

  // Request logging middleware helper
  logRequest: (
    section: LogSection,
    method: string,
    path: string,
    requestId: string
  ) => {
    log('info', section, `${method} ${path}`, { requestId });
  },

  logResponse: (
    section: LogSection,
    method: string,
    path: string,
    status: number,
    requestId: string,
    duration: number
  ) => {
    const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    log(level, section, `${method} ${path} → ${status}`, { requestId, duration });
  },
};

export default logger;

