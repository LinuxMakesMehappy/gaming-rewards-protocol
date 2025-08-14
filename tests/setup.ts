// Test environment setup
process.env.NODE_ENV = 'test';
process.env.TEST_MODE = 'true';
process.env.SOLANA_RPC_URL = 'http://localhost:8899';
process.env.STEAM_API_KEY = 'test_api_key';
process.env.SENTRY_DSN = 'https://test@sentry.io/test';

// Mock console methods to reduce noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = (...args: any[]) => {
  if (process.env.VERBOSE_TESTS) {
    originalConsoleLog(...args);
  }
};

console.error = (...args: any[]) => {
  if (process.env.VERBOSE_TESTS) {
    originalConsoleError(...args);
  }
};

console.warn = (...args: any[]) => {
  if (process.env.VERBOSE_TESTS) {
    originalConsoleWarn(...args);
  }
};

// Global test timeout
jest.setTimeout(30000);
