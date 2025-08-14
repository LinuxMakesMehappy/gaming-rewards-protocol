import { Logger } from '../utils/logger';
import { RateLimiter } from './rate-limiter';
import { FraudDetector } from './fraud-detector';
import { SessionManager } from './session-manager';
import { SecurityConfig, ValidationResult, Achievement, RewardResult } from '../index';

export class SecurityManager {
    private logger: Logger;
    private rateLimiter: RateLimiter;
    private fraudDetector: FraudDetector;
    private sessionManager: SessionManager;
    private config: SecurityConfig;

    constructor(config: SecurityConfig) {
        this.config = config;
        this.logger = new Logger('SecurityManager');
        this.rateLimiter = new RateLimiter(config.rateLimitRequestsPerMinute, config.rateLimitBurstSize);
        this.fraudDetector = new FraudDetector();
        this.sessionManager = new SessionManager(config.sessionTimeout);
        
        this.logger.security('Security manager initialized with zero-CVE policy');
    }

    async initialize(): Promise<void> {
        await this.rateLimiter.initialize();
        await this.fraudDetector.initialize();
        await this.sessionManager.initialize();
        
        this.logger.security('Security manager initialization completed');
    }

    async validateUser(steamId: string, walletAddress: string): Promise<ValidationResult> {
        try {
            this.logger.security('Validating user', { steamId, walletAddress });

            // Rate limiting check
            if (!this.rateLimiter.checkLimit(steamId)) {
                this.logger.security('Rate limit exceeded for user', { steamId });
                return {
                    success: false,
                    steamVerified: false,
                    walletVerified: false,
                    fraudDetected: false,
                    verificationScore: 0
                };
            }

            // Fraud detection check
            const fraudDetected = await this.fraudDetector.checkUser(steamId, walletAddress);
            if (fraudDetected) {
                this.logger.security('Fraud detected for user', { steamId, walletAddress });
                return {
                    success: false,
                    steamVerified: false,
                    walletVerified: false,
                    fraudDetected: true,
                    verificationScore: 0
                };
            }

            // Session validation
            const sessionValid = this.sessionManager.validateSession(steamId);
            if (!sessionValid) {
                this.logger.security('Invalid session for user', { steamId });
                return {
                    success: false,
                    steamVerified: false,
                    walletVerified: false,
                    fraudDetected: false,
                    verificationScore: 0
                };
            }

            // Verification score calculation
            const verificationScore = this.calculateVerificationScore(steamId, walletAddress);

            this.logger.security('User validation completed', { 
                steamId, 
                walletAddress, 
                verificationScore 
            });

            return {
                success: true,
                steamVerified: true,
                walletVerified: true,
                fraudDetected: false,
                verificationScore
            };

        } catch (error) {
            this.logger.error('User validation failed', { error, steamId, walletAddress });
            throw error;
        }
    }

    async processReward(achievement: Achievement, userAddress: string): Promise<RewardResult> {
        try {
            this.logger.security('Processing reward', { 
                achievementId: achievement.id, 
                userAddress 
            });

            // Validate achievement timestamp
            const currentTime = Date.now();
            const ageThreshold = this.config.maxVerificationAge * 1000;
            
            if (currentTime - achievement.timestamp > ageThreshold) {
                this.logger.security('Achievement too old', { 
                    achievementId: achievement.id, 
                    age: currentTime - achievement.timestamp 
                });
                return {
                    success: false,
                    amount: 0,
                    error: 'Achievement verification expired'
                };
            }

            // Rate limiting for reward processing
            if (!this.rateLimiter.checkLimit(userAddress)) {
                this.logger.security('Rate limit exceeded for reward processing', { userAddress });
                return {
                    success: false,
                    amount: 0,
                    error: 'Rate limit exceeded'
                };
            }

            // Fraud detection for reward
            const fraudDetected = await this.fraudDetector.checkReward(achievement, userAddress);
            if (fraudDetected) {
                this.logger.security('Fraud detected in reward', { 
                    achievementId: achievement.id, 
                    userAddress 
                });
                return {
                    success: false,
                    amount: 0,
                    error: 'Fraud detected'
                };
            }

            // Calculate reward amount
            const rewardAmount = this.calculateRewardAmount(achievement);

            this.logger.security('Reward processed successfully', { 
                achievementId: achievement.id, 
                userAddress, 
                rewardAmount 
            });

            return {
                success: true,
                amount: rewardAmount
            };

        } catch (error) {
            this.logger.error('Reward processing failed', { error, achievement, userAddress });
            throw error;
        }
    }

    private calculateVerificationScore(steamId: string, walletAddress: string): number {
        let score = 0;

        // Steam ID validation (basic format check)
        if (this.isValidSteamId(steamId)) {
            score += 25;
        }

        // Wallet address validation (basic format check)
        if (this.isValidWalletAddress(walletAddress)) {
            score += 25;
        }

        // Session validity
        if (this.sessionManager.validateSession(steamId)) {
            score += 25;
        }

        // Historical behavior (simplified)
        if (this.fraudDetector.getUserReputation(steamId) > 0) {
            score += 25;
        }

        return Math.min(score, 100);
    }

    private calculateRewardAmount(achievement: Achievement): number {
        const baseAmount = achievement.value * 100; // 100 lamports per point
        const maxAmount = 10000000; // 10M lamports max
        
        return Math.min(baseAmount, maxAmount);
    }

    private isValidSteamId(steamId: string): boolean {
        return /^[0-9]{17}$/.test(steamId);
    }

    private isValidWalletAddress(walletAddress: string): boolean {
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress);
    }

    async shutdown(): Promise<void> {
        await this.rateLimiter.shutdown();
        await this.fraudDetector.shutdown();
        await this.sessionManager.shutdown();
        
        this.logger.security('Security manager shutdown completed');
    }
}
