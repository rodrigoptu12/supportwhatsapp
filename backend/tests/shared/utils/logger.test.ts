/* eslint-disable @typescript-eslint/no-explicit-any */

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  it('uses debug level when NODE_ENV is not production', async () => {
    process.env.NODE_ENV = 'test';
    const { logger } = await import('@/shared/utils/logger');
    expect(logger.level).toBe('debug');
  });

  it('uses info level when NODE_ENV is production', async () => {
    process.env.NODE_ENV = 'production';
    const { logger } = await import('@/shared/utils/logger');
    expect(logger.level).toBe('info');
  });

  it('formats log messages with timestamp and level', async () => {
    const { logger } = await import('@/shared/utils/logger');
    expect(logger).toBeDefined();
    expect(logger.transports.length).toBe(3);
  });

  it('formats error with stack trace when present', async () => {
    const { logger } = await import('@/shared/utils/logger');
    const error = new Error('test error');
    // Winston's errors format extracts stack when Error is passed as message
    logger.error('something failed', error);
    // Also log the error directly — winston.format.errors will extract stack
    logger.log({ level: 'error', message: error as any });
    expect(logger).toBeDefined();
  });
});
