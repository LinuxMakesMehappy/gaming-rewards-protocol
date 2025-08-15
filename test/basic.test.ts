import { describe, it, expect } from 'vitest';
import { TEST_CONFIG, TestDataFactory, TestAssertions, TestUtils } from './test-setup';

describe('Basic Test Suite', () => {
  it('should have valid test configuration', () => {
    expect(TEST_CONFIG).toBeDefined();
    expect(TEST_CONFIG.SOLANA_RPC_URL).toBeDefined();
    expect(TEST_CONFIG.STEAM_API_KEY).toBeDefined();
    expect(TEST_CONFIG.TEST_STEAM_ID).toBeDefined();
  });

  it('should create valid test data', () => {
    const steamId = TestDataFactory.createValidSteamId();
    expect(steamId).toBeDefined();
    expect(steamId.length).toBe(17);
    expect(steamId).toMatch(/^\d{17}$/);
  });

  it('should validate Steam ID format', () => {
    const validSteamId = '76561198012345678';
    const invalidSteamId = 'invalid-id';
    
    expect(() => TestAssertions.assertValidSteamId(validSteamId)).not.toThrow();
    expect(() => TestAssertions.assertValidSteamId(invalidSteamId)).toThrow();
  });

  it('should validate reward amounts', () => {
    expect(() => TestAssertions.assertValidRewardAmount(100)).not.toThrow();
    expect(() => TestAssertions.assertValidRewardAmount(0)).toThrow();
    expect(() => TestAssertions.assertValidRewardAmount(-100)).toThrow();
    expect(() => TestAssertions.assertValidRewardAmount(1000000001)).toThrow();
  });

  it('should validate fraud scores', () => {
    expect(() => TestAssertions.assertValidFraudScore(50)).not.toThrow();
    expect(() => TestAssertions.assertValidFraudScore(0)).not.toThrow();
    expect(() => TestAssertions.assertValidFraudScore(100)).not.toThrow();
    expect(() => TestAssertions.assertValidFraudScore(-1)).toThrow();
    expect(() => TestAssertions.assertValidFraudScore(101)).toThrow();
  });

  it('should generate mock Steam data', () => {
    const mockData = TestUtils.generateMockSteamData();
    expect(mockData.steamId).toBe(TEST_CONFIG.TEST_STEAM_ID);
    expect(mockData.username).toBeDefined();
    expect(mockData.accountAge).toBeGreaterThan(0);
    expect(mockData.gameCount).toBeGreaterThan(0);
  });

  it('should generate mock achievement data', () => {
    const mockData = TestUtils.generateMockAchievement();
    expect(mockData.id).toBe(TEST_CONFIG.TEST_ACHIEVEMENT_ID);
    expect(mockData.gameId).toBe(TEST_CONFIG.TEST_GAME_ID);
    expect(mockData.unlockedAt).toBeGreaterThan(0);
  });

  it('should generate mock user registration data', () => {
    const mockData = TestUtils.generateMockUserRegistration();
    expect(mockData.steamId).toBe(TEST_CONFIG.TEST_STEAM_ID);
    expect(mockData.steamData).toBeDefined();
    expect(mockData.securityVerification).toBeDefined();
  });
});

describe('Performance Test Utils', () => {
  it('should measure execution time', async () => {
    const { PerformanceTestUtils } = await import('./test-setup');
    
    const result = await PerformanceTestUtils.measureExecutionTime(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'test result';
    });
    
    expect(result.result).toBe('test result');
    expect(result.duration).toBeGreaterThan(0);
  });

  it('should run stress tests', async () => {
    const { PerformanceTestUtils } = await import('./test-setup');
    
    const testFunction = async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return 'test';
    };
    
    const result = await PerformanceTestUtils.stressTest(testFunction, 5, 2);
    
    expect(result.results).toHaveLength(5);
    expect(result.avgDuration).toBeGreaterThan(0);
    expect(result.maxDuration).toBeGreaterThan(0);
    expect(result.minDuration).toBeGreaterThan(0);
  });
});

describe('Security Test Utils', () => {
  it('should generate malicious inputs', async () => {
    const { SecurityTestUtils } = await import('./test-setup');
    
    const xssInput = SecurityTestUtils.generateMaliciousInput();
    const sqlInput = SecurityTestUtils.generateSqlInjectionInput();
    const overflowInput = SecurityTestUtils.generateOverflowInput();
    
    expect(xssInput).toContain('<script>');
    expect(sqlInput).toContain('DROP TABLE');
    expect(overflowInput.length).toBe(10000);
  });

  it('should test rate limiting', async () => {
    const { SecurityTestUtils } = await import('./test-setup');
    
    let callCount = 0;
    const testFn = async () => {
      callCount++;
      if (callCount > 3) {
        throw new Error('Rate limit exceeded');
      }
      return 'success';
    };
    
    const result = await SecurityTestUtils.testRateLimiting(testFn, 3);
    expect(result).toBe(true);
  });
});
