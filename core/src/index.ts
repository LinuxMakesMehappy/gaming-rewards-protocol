import { JupiterIntegration } from './jupiter-integration';
import { SteamValidation } from './steam-validation';
import { SecurityManager } from './security-manager';
import { Logger } from './utils/logger';

export class GamingRewardsCore {
    private jupiterIntegration: JupiterIntegration;
    private steamValidation: SteamValidation;
    private securityManager: SecurityManager;
    private logger: Logger;

    constructor(config: CoreConfig) {
        this.logger = new Logger('GamingRewardsCore');
        this.securityManager = new SecurityManager(config.security);
        this.jupiterIntegration = new JupiterIntegration(config.jupiter, this.securityManager);
        this.steamValidation = new SteamValidation(config.steam, this.securityManager);
        
        this.logger.info('Gaming Rewards Core initialized with zero-CVE security');
    }

    async initialize(): Promise<void> {
        try {
            await this.securityManager.initialize();
            await this.jupiterIntegration.initialize();
            await this.steamValidation.initialize();
            
            this.logger.info('Core system initialization completed');
        } catch (error) {
            this.logger.error('Core initialization failed', { error });
            throw error;
        }
    }

    async validateUser(steamId: string, walletAddress: string): Promise<ValidationResult> {
        return this.securityManager.validateUser(steamId, walletAddress);
    }

    async processReward(achievement: Achievement, userAddress: string): Promise<RewardResult> {
        return this.securityManager.processReward(achievement, userAddress);
    }

    async getJupiterQuote(inputMint: string, outputMint: string, amount: number): Promise<QuoteResult> {
        return this.jupiterIntegration.getQuote(inputMint, outputMint, amount);
    }

    async executeSwap(quote: QuoteResult, userAddress: string): Promise<SwapResult> {
        return this.jupiterIntegration.executeSwap(quote, userAddress);
    }

    async shutdown(): Promise<void> {
        await this.securityManager.shutdown();
        await this.jupiterIntegration.shutdown();
        await this.steamValidation.shutdown();
        
        this.logger.info('Core system shutdown completed');
    }
}

export interface CoreConfig {
    jupiter: JupiterConfig;
    steam: SteamConfig;
    security: SecurityConfig;
}

export interface JupiterConfig {
    apiUrl: string;
    apiKey?: string;
    poolAddress: string;
}

export interface SteamConfig {
    apiKey: string;
    openidRealm: string;
    sessionTimeout: number;
}

export interface SecurityConfig {
    rateLimitRequestsPerMinute: number;
    rateLimitBurstSize: number;
    sessionTimeout: number;
    maxVerificationAge: number;
}

export interface ValidationResult {
    success: boolean;
    steamVerified: boolean;
    walletVerified: boolean;
    fraudDetected: boolean;
    verificationScore: number;
}

export interface RewardResult {
    success: boolean;
    amount: number;
    transactionHash?: string;
    error?: string;
}

export interface QuoteResult {
    inputMint: string;
    outputMint: string;
    amount: number;
    expectedOutput: number;
    priceImpact: number;
    fee: number;
}

export interface SwapResult {
    success: boolean;
    transactionHash?: string;
    outputAmount: number;
    error?: string;
}

export interface Achievement {
    id: string;
    name: string;
    value: number;
    steamId: string;
    timestamp: number;
}

export { JupiterIntegration, SteamValidation, SecurityManager };
