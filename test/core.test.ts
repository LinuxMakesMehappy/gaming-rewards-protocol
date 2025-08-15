import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest';
import { GamingRewardsCore } from '../core/src/index';
import { 
    TestUtils, 
    TestDataFactory, 
    TestAssertions, 
    PerformanceTestUtils,
    SecurityTestUtils,
    TEST_CONFIG 
} from './test-setup';

describe('GamingRewardsCore', () => {
    let core: GamingRewardsCore;

    beforeAll(async () => {
        await TestUtils.initialize();
    });

    beforeEach(async () => {
        // Initialize core with test configuration
        core = new GamingRewardsCore({
            solana: {
                rpcUrl: TEST_CONFIG.SOLANA_RPC_URL,
                wsUrl: TEST_CONFIG.SOLANA_WS_URL,
                commitment: 'confirmed'
            },
            jupiter: {
                apiUrl: TEST_CONFIG.JUPITER_API_URL,
                apiKey: TEST_CONFIG.JUPITER_API_KEY
            },
            steam: {
                apiKey: TEST_CONFIG.STEAM_API_KEY,
                openidRealm: TEST_CONFIG.STEAM_OPENID_REALM,
                sessionTimeout: 300000
            },
            security: {
                maxFraudScore: TEST_CONFIG.MAX_FRAUD_SCORE,
                rateLimitWindow: TEST_CONFIG.RATE_LIMIT_WINDOW,
                maxRequestsPerWindow: TEST_CONFIG.MAX_REQUESTS_PER_WINDOW
            }
        });

        await core.initialize();
    });

    afterAll(async () => {
        if (core) {
            await core.shutdown();
        }
    });

    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            expect(core).toBeDefined();
            expect(core.isInitialized()).toBe(true);
        });

        it('should handle initialization errors gracefully', async () => {
            const invalidCore = new GamingRewardsCore({
                solana: {
                    rpcUrl: 'invalid-url',
                    wsUrl: 'invalid-ws-url',
                    commitment: 'confirmed'
                },
                jupiter: {
                    apiUrl: 'invalid-jupiter-url',
                    apiKey: 'invalid-key'
                },
                steam: {
                    apiKey: 'invalid-steam-key',
                    openidRealm: 'invalid-realm',
                    sessionTimeout: 300000
                },
                security: {
                    maxFraudScore: 80,
                    rateLimitWindow: 60000,
                    maxRequestsPerWindow: 100
                }
            });

            await expect(invalidCore.initialize()).rejects.toThrow();
        });
    });

    describe('User Registration', () => {
        it('should register a valid user successfully', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();

            const result = await core.registerUser(steamId, userData);

            expect(result.success).toBe(true);
            expect(result.userId).toBeDefined();
            TestAssertions.assertValidSteamId(result.steamId);
        });

        it('should reject invalid Steam ID', async () => {
            const invalidSteamId = TestDataFactory.createInvalidSteamId();
            const userData = TestUtils.generateMockUserRegistration();

            const result = await core.registerUser(invalidSteamId, userData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid Steam ID');
        });

        it('should reject suspicious users', async () => {
            const suspiciousSteamId = TestDataFactory.createSuspiciousSteamId();
            const userData = TestUtils.generateMockUserRegistration();
            userData.securityVerification.fraudScore = 90; // High fraud score

            const result = await core.registerUser(suspiciousSteamId, userData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('fraud');
        });

        it('should handle duplicate registration attempts', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();

            // First registration
            const result1 = await core.registerUser(steamId, userData);
            expect(result1.success).toBe(true);

            // Duplicate registration
            const result2 = await core.registerUser(steamId, userData);
            expect(result2.success).toBe(false);
            expect(result2.error).toContain('already registered');
        });
    });

    describe('Achievement Processing', () => {
        it('should process valid achievement successfully', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();
            
            // Register user first
            await core.registerUser(steamId, userData);

            const achievement = TestDataFactory.createAchievementValidation();
            const rewardAmount = 1000000; // 1 token

            const result = await core.processReward(steamId, achievement, rewardAmount);

            expect(result.success).toBe(true);
            expect(result.rewardAmount).toBe(rewardAmount);
            TestAssertions.assertTransactionSuccess(result.transactionSignature);
        });

        it('should reject unregistered users', async () => {
            const unregisteredSteamId = '76561198099999999';
            const achievement = TestDataFactory.createAchievementValidation();
            const rewardAmount = 1000000;

            const result = await core.processReward(unregisteredSteamId, achievement, rewardAmount);

            expect(result.success).toBe(false);
            expect(result.error).toContain('not registered');
        });

        it('should reject invalid reward amounts', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();
            
            await core.registerUser(steamId, userData);

            const achievement = TestDataFactory.createAchievementValidation();
            const invalidRewardAmount = 0;

            const result = await core.processReward(steamId, achievement, invalidRewardAmount);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid reward amount');
        });

        it('should reject duplicate achievements', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();
            
            await core.registerUser(steamId, userData);

            const achievement = TestDataFactory.createAchievementValidation();
            const rewardAmount = 1000000;

            // First processing
            const result1 = await core.processReward(steamId, achievement, rewardAmount);
            expect(result1.success).toBe(true);

            // Duplicate processing
            const result2 = await core.processReward(steamId, achievement, rewardAmount);
            expect(result2.success).toBe(false);
            expect(result2.error).toContain('already processed');
        });
    });

    describe('Staking Operations', () => {
        it('should stake rewards successfully', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();
            
            await core.registerUser(steamId, userData);

            const stakeAmount = 500000; // 0.5 tokens
            const lockPeriod = 30; // 30 days

            const result = await core.stakeUserRewards(steamId, stakeAmount, lockPeriod);

            expect(result.success).toBe(true);
            expect(result.stakeId).toBeDefined();
            expect(result.lockPeriod).toBe(lockPeriod);
            TestAssertions.assertTransactionSuccess(result.transactionSignature);
        });

        it('should reject insufficient balance for staking', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();
            
            await core.registerUser(steamId, userData);

            const excessiveStakeAmount = 1000000000; // 1000 tokens
            const lockPeriod = 30;

            const result = await core.stakeUserRewards(steamId, excessiveStakeAmount, lockPeriod);

            expect(result.success).toBe(false);
            expect(result.error).toContain('insufficient balance');
        });

        it('should unstake rewards successfully', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();
            
            await core.registerUser(steamId, userData);

            // First stake
            const stakeAmount = 500000;
            const lockPeriod = 1; // 1 day for testing
            const stakeResult = await core.stakeUserRewards(steamId, stakeAmount, lockPeriod);
            expect(stakeResult.success).toBe(true);

            // Wait for lock period to expire (in real test, you'd mock time)
            // For now, we'll test the unstaking logic
            const unstakeResult = await core.unstakeUserRewards(steamId, stakeResult.stakeId);

            expect(unstakeResult.success).toBe(true);
            expect(unstakeResult.unstakedAmount).toBe(stakeAmount);
        });
    });

    describe('Jupiter Integration', () => {
        it('should get swap quote successfully', async () => {
            const quoteRequest = TestDataFactory.createJupiterQuoteRequest();

            const result = await core.getSwapQuote(quoteRequest);

            expect(result.success).toBe(true);
            expect(result.quote).toBeDefined();
            expect(result.quote.inputAmount).toBe(quoteRequest.amount);
            expect(result.quote.outputAmount).toBeGreaterThan(0);
        });

        it('should execute swap successfully', async () => {
            const quoteRequest = TestDataFactory.createJupiterQuoteRequest();

            // Get quote first
            const quoteResult = await core.getSwapQuote(quoteRequest);
            expect(quoteResult.success).toBe(true);

            // Execute swap
            const swapResult = await core.executeSwap(quoteResult.quote);

            expect(swapResult.success).toBe(true);
            TestAssertions.assertTransactionSuccess(swapResult.transactionSignature);
        });

        it('should handle swap failures gracefully', async () => {
            const invalidQuoteRequest = {
                inputMint: 'invalid-mint',
                outputMint: 'invalid-mint',
                amount: '0',
                slippageBps: 50
            };

            const result = await core.getSwapQuote(invalidQuoteRequest);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Security Features', () => {
        it('should enforce rate limiting', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();

            // Test rate limiting by making many requests
            const requests = Array.from({ length: 150 }, () => 
                core.registerUser(steamId, userData)
            );

            const results = await Promise.allSettled(requests);
            const failures = results.filter(result => result.status === 'rejected');

            expect(failures.length).toBeGreaterThan(0);
        });

        it('should validate input sanitization', async () => {
            const maliciousInputs = [
                SecurityTestUtils.generateMaliciousInput(),
                SecurityTestUtils.generateSqlInjectionInput(),
                SecurityTestUtils.generateOverflowInput()
            ];

            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();

            for (const maliciousInput of maliciousInputs) {
                const result = await core.registerUser(maliciousInput, userData);
                expect(result.success).toBe(false);
                expect(result.error).toContain('Invalid');
            }
        });

        it('should detect fraud patterns', async () => {
            const suspiciousSteamId = TestDataFactory.createSuspiciousSteamId();
            const userData = TestUtils.generateMockUserRegistration();
            userData.securityVerification.fraudScore = 85;

            const result = await core.registerUser(suspiciousSteamId, userData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('fraud');
        });
    });

    describe('Performance', () => {
        it('should handle concurrent user registrations', async () => {
            const { results, avgDuration, maxDuration } = await PerformanceTestUtils.stressTest(
                async () => {
                    const steamId = `76561198${Math.random().toString().slice(2, 10)}`;
                    const userData = TestUtils.generateMockUserRegistration();
                    return core.registerUser(steamId, userData);
                },
                10, // 10 iterations
                5   // 5 concurrent requests
            );

            const successCount = results.filter(r => r.success).length;
            expect(successCount).toBeGreaterThan(0);
            expect(avgDuration).toBeLessThan(5000); // Should complete within 5 seconds
        });

        it('should process achievements efficiently', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();
            await core.registerUser(steamId, userData);

            const { avgDuration } = await PerformanceTestUtils.stressTest(
                async () => {
                    const achievement = {
                        ...TestDataFactory.createAchievementValidation(),
                        id: `achievement_${Math.random()}`
                    };
                    return core.processReward(steamId, achievement, 1000000);
                },
                5, // 5 iterations
                1   // Sequential for this test
            );

            expect(avgDuration).toBeLessThan(3000); // Should complete within 3 seconds
        });
    });

    describe('Error Handling', () => {
        it('should handle network failures gracefully', async () => {
            // Temporarily break the connection
            const originalRpcUrl = core['config'].solana.rpcUrl;
            core['config'].solana.rpcUrl = 'https://invalid-rpc-url.com';

            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();

            const result = await core.registerUser(steamId, userData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('network');

            // Restore connection
            core['config'].solana.rpcUrl = originalRpcUrl;
        });

        it('should handle API timeouts', async () => {
            const steamId = TestDataFactory.createValidSteamId();
            const userData = TestUtils.generateMockUserRegistration();

            // Set very short timeout
            const originalTimeout = core['config'].jupiter.timeout;
            core['config'].jupiter.timeout = 1; // 1ms timeout

            const result = await core.registerUser(steamId, userData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('timeout');

            // Restore timeout
            core['config'].jupiter.timeout = originalTimeout;
        });
    });

    describe('Data Validation', () => {
        it('should validate Steam ID format', () => {
            const validSteamId = TestDataFactory.createValidSteamId();
            TestAssertions.assertValidSteamId(validSteamId);

            expect(() => {
                TestAssertions.assertValidSteamId(TestDataFactory.createInvalidSteamId());
            }).toThrow();
        });

        it('should validate achievement data', () => {
            const validAchievement = TestDataFactory.createAchievementValidation();
            TestAssertions.assertValidAchievement(validAchievement);

            expect(() => {
                TestAssertions.assertValidAchievement({ id: 'test' });
            }).toThrow();
        });

        it('should validate reward amounts', () => {
            TestAssertions.assertValidRewardAmount(1000000);

            expect(() => {
                TestAssertions.assertValidRewardAmount(0);
            }).toThrow();

            expect(() => {
                TestAssertions.assertValidRewardAmount(2000000000);
            }).toThrow();
        });
    });
});
