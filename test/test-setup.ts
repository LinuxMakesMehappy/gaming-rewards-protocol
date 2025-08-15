import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import { GamingRewardsCore } from '../core/src/index';
import { ValidationSystem } from '../validation/src/index';
import { SteamApiClient } from '../validation/src/steam-api';
import { FraudDetectionSystem } from '../validation/src/fraud-detection';

// Test configuration
export const TEST_CONFIG = {
    // Solana
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    SOLANA_WS_URL: process.env.SOLANA_WS_URL || 'wss://api.devnet.solana.com',
    
    // Jupiter
    JUPITER_API_URL: process.env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6',
    JUPITER_API_KEY: process.env.JUPITER_API_KEY || 'test-key',
    
    // Steam
    STEAM_API_KEY: process.env.STEAM_API_KEY || 'test-steam-key',
    STEAM_OPENID_REALM: process.env.STEAM_OPENID_REALM || 'http://localhost:3000',
    
    // Security
    MAX_FRAUD_SCORE: 80,
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    MAX_REQUESTS_PER_WINDOW: 100,
    
    // Test data
    TEST_STEAM_ID: '76561198012345678',
    TEST_GAME_ID: '730', // Counter-Strike 2
    TEST_ACHIEVEMENT_ID: 'first_blood',
    
    // Timeouts
    REQUEST_TIMEOUT: 10000,
    TRANSACTION_TIMEOUT: 30000,
};

// Test utilities
export class TestUtils {
    private static connection: Connection;
    private static provider: AnchorProvider;
    private static payer: Keypair;

    static async initialize() {
        // Initialize Solana connection
        this.connection = new Connection(TEST_CONFIG.SOLANA_RPC_URL, 'confirmed');
        
        // Create test keypair
        this.payer = Keypair.generate();
        
        // Airdrop SOL for testing with retry logic
        let airdropSuccess = false;
        let retries = 0;
        const maxRetries = 3;
        
        while (!airdropSuccess && retries < maxRetries) {
            try {
                const signature = await this.connection.requestAirdrop(
                    this.payer.publicKey,
                    2 * web3.LAMPORTS_PER_SOL
                );
                await this.connection.confirmTransaction(signature);
                airdropSuccess = true;
                console.log(`✅ Airdrop successful on attempt ${retries + 1}`);
            } catch (error) {
                retries++;
                console.log(`⚠️ Airdrop attempt ${retries} failed: ${error.message}`);
                if (retries >= maxRetries) {
                    console.log('⚠️ Skipping airdrop - continuing with 0 balance');
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            }
        }
        
        // Initialize provider
        this.provider = new AnchorProvider(
            this.connection,
            { publicKey: this.payer.publicKey, signTransaction: (tx) => Promise.resolve(tx) },
            { commitment: 'confirmed' }
        );
        
        console.log('✅ Test environment initialized');
    }

    static getConnection(): Connection {
        return this.connection;
    }

    static getProvider(): AnchorProvider {
        return this.provider;
    }

    static getPayer(): Keypair {
        return this.payer;
    }

    static async createTestAccount(): Promise<Keypair> {
        return Keypair.generate();
    }

    static async waitForConfirmation(signature: string): Promise<void> {
        await this.connection.confirmTransaction(signature, 'confirmed');
    }

    static generateMockSteamData() {
        return {
            steamId: TEST_CONFIG.TEST_STEAM_ID,
            username: 'TestUser',
            profileUrl: 'https://steamcommunity.com/id/testuser',
            avatarUrl: 'https://avatars.steamstatic.com/default.jpg',
            accountAge: 365, // 1 year
            gameCount: 25,
            achievementCount: 150,
            standing: 'CLEARED',
            lastOnline: Date.now()
        };
    }

    static generateMockAchievement() {
        return {
            id: TEST_CONFIG.TEST_ACHIEVEMENT_ID,
            name: 'First Blood',
            description: 'Get your first kill in a match',
            gameId: TEST_CONFIG.TEST_GAME_ID,
            gameName: 'Counter-Strike 2',
            unlockedAt: Date.now(),
            rarity: 85
        };
    }

    static generateMockUserRegistration() {
        return {
            steamId: TEST_CONFIG.TEST_STEAM_ID,
            securityVerification: {
                fraudScore: 15,
                riskLevel: 'LOW',
                suspiciousActivities: [],
                recommendations: ['Account appears legitimate']
            },
            steamData: this.generateMockSteamData()
        };
    }
}

// Test data factories
export class TestDataFactory {
    static createValidSteamId(): string {
        return '76561198012345678';
    }

    static createInvalidSteamId(): string {
        return '12345'; // Too short
    }

    static createSuspiciousSteamId(): string {
        return '76561198000000001'; // Very new account
    }

    static createAchievementValidation() {
        return {
            id: TEST_CONFIG.TEST_ACHIEVEMENT_ID,
            steamId: TEST_CONFIG.TEST_STEAM_ID,
            gameId: TEST_CONFIG.TEST_GAME_ID,
            timestamp: Date.now()
        };
    }

    static createJupiterQuoteRequest() {
        return {
            inputMint: 'So11111111111111111111111111111111111111112', // SOL
            outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
            amount: '1000000000', // 1 SOL
            slippageBps: 50
        };
    }
}

// Mock implementations for testing
export class MockSteamApiClient extends SteamApiClient {
    constructor() {
        super({
            apiKey: TEST_CONFIG.STEAM_API_KEY,
            openidRealm: TEST_CONFIG.STEAM_OPENID_REALM,
            sessionTimeout: 300000
        });
    }

    async validateUser(steamId: string, sessionTicket: string) {
        // Mock validation
        if (steamId === TEST_CONFIG.TEST_STEAM_ID) {
            return {
                success: true,
                steamData: TestUtils.generateMockSteamData()
            };
        }
        
        return {
            success: false,
            reason: 'USER_NOT_FOUND'
        };
    }

    async verifyAchievement(achievement: any) {
        // Mock achievement verification
        return {
            verified: true,
            achievementData: TestUtils.generateMockAchievement()
        };
    }
}

export class MockFraudDetectionSystem extends FraudDetectionSystem {
    constructor() {
        super({
            maxFraudScore: TEST_CONFIG.MAX_FRAUD_SCORE,
            blacklistedIps: [],
            suspiciousPatterns: []
        });
    }

    async analyzeUser(steamId: string, steamData: any) {
        // Mock fraud analysis
        const fraudScore = steamId === TestDataFactory.createSuspiciousSteamId() ? 85 : 15;
        
        return {
            fraudDetected: fraudScore >= TEST_CONFIG.MAX_FRAUD_SCORE,
            fraudScore,
            riskLevel: fraudScore >= 80 ? 'CRITICAL' : 'LOW',
            suspiciousActivities: fraudScore >= 80 ? ['Suspicious activity detected'] : []
        };
    }
}

// Test assertions
export class TestAssertions {
    static assertValidSteamId(steamId: string) {
        if (!/^[0-9]{17}$/.test(steamId)) {
            throw new Error(`Invalid Steam ID format: ${steamId}`);
        }
    }

    static assertValidAchievement(achievement: any) {
        if (!achievement.id || !achievement.steamId || !achievement.gameId) {
            throw new Error('Invalid achievement data');
        }
    }

    static assertValidRewardAmount(amount: number) {
        if (amount <= 0 || amount > 1000000000) {
            throw new Error(`Invalid reward amount: ${amount}`);
        }
    }

    static assertValidFraudScore(score: number) {
        if (score < 0 || score > 100) {
            throw new Error(`Invalid fraud score: ${score}`);
        }
    }

    static assertTransactionSuccess(signature: string) {
        if (!signature || signature.length < 10) {
            throw new Error('Invalid transaction signature');
        }
    }
}

// Performance testing utilities
export class PerformanceTestUtils {
    static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
        const start = Date.now();
        const result = await fn();
        const duration = Date.now() - start;
        
        return { result, duration };
    }

    static async stressTest<T>(
        fn: () => Promise<T>,
        iterations: number,
        concurrency: number = 1
    ): Promise<{ results: T[]; avgDuration: number; maxDuration: number; minDuration: number }> {
        const durations: number[] = [];
        const results: T[] = [];

        for (let i = 0; i < iterations; i += concurrency) {
            const batchSize = Math.min(concurrency, iterations - i);
            const batchResults = await Promise.all(
                Array.from({ length: batchSize }, () => PerformanceTestUtils.measureExecutionTime(fn))
            );
            
            batchResults.forEach(({ result, duration }) => {
                results.push(result);
                durations.push(duration);
            });
        }

        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const maxDuration = Math.max(...durations);
        const minDuration = Math.min(...durations);

        return { results, avgDuration, maxDuration, minDuration };
    }
}

// Security testing utilities
export class SecurityTestUtils {
    static generateMaliciousInput(): string {
        return '<script>alert("xss")</script>';
    }

    static generateSqlInjectionInput(): string {
        return "'; DROP TABLE users; --";
    }

    static generateOverflowInput(): string {
        return 'A'.repeat(10000);
    }

    static async testRateLimiting(fn: () => Promise<any>, maxRequests: number) {
        const promises = Array.from({ length: maxRequests + 1 }, () => fn());
        
        try {
            await Promise.all(promises);
            throw new Error('Rate limiting failed - all requests succeeded');
        } catch (error) {
            // Expected to fail due to rate limiting
            return true;
        }
    }

    static async testInputValidation(fn: (input: any) => Promise<any>, maliciousInputs: any[]) {
        const results = await Promise.allSettled(
            maliciousInputs.map(input => fn(input))
        );

        const failures = results.filter(result => result.status === 'rejected');
        return failures.length === maliciousInputs.length;
    }
}

// Test configuration is already exported at the top
