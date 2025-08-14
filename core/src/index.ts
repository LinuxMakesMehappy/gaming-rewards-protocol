import { JupiterIntegration } from './jupiter-integration';
import { SteamValidation } from './steam-validation';
import { SecurityManager } from './security-manager';
import { MilitarySecurityManager } from './security-manager/military-security';
import { ProtocolEconomics } from './protocol-economics';
import { EnhancedSteamValidation } from './steam-validation/enhanced-validation';
import { Logger } from './utils/logger';

export class GamingRewardsCore {
    private jupiterIntegration: JupiterIntegration;
    private steamValidation: SteamValidation;
    private securityManager: SecurityManager;
    private militarySecurity: MilitarySecurityManager;
    private protocolEconomics: ProtocolEconomics;
    private enhancedSteamValidation: EnhancedSteamValidation;
    private logger: Logger;

    constructor(config: CoreConfig) {
        this.logger = new Logger('GamingRewardsCore');
        this.securityManager = new SecurityManager(config.security);
        this.militarySecurity = new MilitarySecurityManager();
        this.protocolEconomics = new ProtocolEconomics();
        this.jupiterIntegration = new JupiterIntegration(config.jupiter, this.securityManager);
        this.steamValidation = new SteamValidation(config.steam, this.securityManager);
        this.enhancedSteamValidation = new EnhancedSteamValidation(
            config.steam.developerApiKey,
            config.steam.apiKey
        );
        
        this.logger.info('Gaming Rewards Core initialized with enhanced staking and military-grade security');
    }

    async initialize(): Promise<void> {
        try {
            await this.securityManager.initialize();
            await this.militarySecurity.initialize();
            await this.protocolEconomics.initialize();
            await this.jupiterIntegration.initialize();
            await this.steamValidation.initialize();
            await this.enhancedSteamValidation.initialize();
            
            this.logger.info('Core system initialization completed with enhanced staking and CIA/NSA/DOD security standards');
        } catch (error) {
            this.logger.error('Core initialization failed', { error });
            throw error;
        }
    }

    async registerUser(userData: UserRegistrationData): Promise<UserRegistrationResult> {
        try {
            this.logger.info('Processing user registration with military-grade security', { 
                steamId: userData.steamId 
            });

            // Military-grade identity validation
            const identityValidation = await this.militarySecurity.validateUserIdentity(userData);
            if (!identityValidation.success) {
                return {
                    success: false,
                    reason: 'IDENTITY_VALIDATION_FAILED',
                    securityLevel: identityValidation.securityLevel
                };
            }

            // Enhanced Steam standing validation
            const steamStanding = await this.enhancedSteamValidation.validateUserStanding(userData.steamId);
            if (!steamStanding.isValid) {
                return {
                    success: false,
                    reason: steamStanding.reason,
                    securityLevel: this.mapSteamStandingToSecurityLevel(steamStanding.standing)
                };
            }

            // Generate secure wallet
            const walletAddress = identityValidation.walletAddress!;

            this.logger.security('User registration completed successfully', { 
                steamId: userData.steamId,
                walletAddress,
                securityLevel: identityValidation.securityLevel
            });

            return {
                success: true,
                walletAddress,
                securityLevel: identityValidation.securityLevel,
                steamStanding: steamStanding.standing
            };

        } catch (error) {
            this.logger.error('User registration failed', { error, steamData: userData });
            throw error;
        }
    }

    async processReward(achievement: Achievement, userAddress: string): Promise<RewardResult> {
        try {
            this.logger.info('Processing reward with enhanced tokenomics and staking', { 
                achievementId: achievement.id, 
                userAddress 
            });

            // Security validation
            const securityResult = await this.securityManager.processReward(achievement, userAddress);
            if (!securityResult.success) {
                return securityResult;
            }

            // Distribute rewards with enhanced tokenomics
            const distribution = await this.protocolEconomics.distributeRewards(securityResult.amount);

            // Execute Jupiter swap for instant liquidity
            const swapResult = await this.jupiterIntegration.executeSwap({
                inputMint: 'SOL',
                outputMint: 'USDC',
                amount: distribution.instantClaims,
                expectedOutput: distribution.instantClaims,
                priceImpact: 0,
                fee: 0
            }, userAddress);

            this.logger.info('Enhanced reward processed successfully', {
                instantClaims: distribution.instantClaims,
                stakingIncentives: distribution.stakingIncentives,
                protocolOperations: distribution.protocolOperations,
                swapSuccess: swapResult.success,
                totalStaked: distribution.stakingStats.totalStaked
            });

            return {
                success: true,
                amount: distribution.instantClaims,
                stakingIncentives: distribution.stakingIncentives,
                transactionHash: swapResult.transactionHash,
                protocolContribution: distribution.protocolOperations,
                stakingStats: distribution.stakingStats
            };

        } catch (error) {
            this.logger.error('Reward processing failed', { error, achievement, userAddress });
            throw error;
        }
    }

    async stakeUserRewards(userAddress: string, amount: number): Promise<StakingResult> {
        try {
            this.logger.info('Processing user staking request', { userAddress, amount });
            
            const stakingResult = await this.protocolEconomics.processUserStaking(userAddress, amount);
            
            if (stakingResult.success) {
                this.logger.info('User staking successful', {
                    userAddress,
                    stakeId: stakingResult.stakeId,
                    amount: stakingResult.amount,
                    estimatedReward: stakingResult.estimatedReward
                });
            }

            return stakingResult;

        } catch (error) {
            this.logger.error('User staking failed', { error, userAddress, amount });
            throw error;
        }
    }

    async unstakeUserRewards(userAddress: string, stakeId: string): Promise<UnstakingResult> {
        try {
            this.logger.info('Processing user unstaking request', { userAddress, stakeId });
            
            const unstakingResult = await this.protocolEconomics.processUserUnstaking(userAddress, stakeId);
            
            if (unstakingResult.success) {
                this.logger.info('User unstaking successful', {
                    userAddress,
                    stakeId: unstakingResult.stakeId,
                    originalAmount: unstakingResult.originalAmount,
                    rewards: unstakingResult.rewards,
                    totalAmount: unstakingResult.totalAmount
                });
            }

            return unstakingResult;

        } catch (error) {
            this.logger.error('User unstaking failed', { error, userAddress, stakeId });
            throw error;
        }
    }

    async getUserStakingInfo(userAddress: string): Promise<StakingInfo> {
        return await this.protocolEconomics.getUserStakingInfo(userAddress);
    }

    async getProtocolStatus(): Promise<ProtocolStatus> {
        return await this.protocolEconomics.getProtocolStatus();
    }

    async getJupiterQuote(inputMint: string, outputMint: string, amount: number): Promise<QuoteResult> {
        return this.jupiterIntegration.getQuote(inputMint, outputMint, amount);
    }

    async executeSwap(quote: QuoteResult, userAddress: string): Promise<SwapResult> {
        return this.jupiterIntegration.executeSwap(quote, userAddress);
    }

    private mapSteamStandingToSecurityLevel(steamStanding: SteamStanding): SecurityLevel {
        switch (steamStanding) {
            case SteamStanding.CLEARED:
                return SecurityLevel.CLEARED;
            case SteamStanding.SUSPICIOUS:
                return SecurityLevel.SUSPICIOUS;
            case SteamStanding.BLACKLISTED:
                return SecurityLevel.BLACKLISTED;
            case SteamStanding.INELIGIBLE:
                return SecurityLevel.REJECTED;
            default:
                return SecurityLevel.REJECTED;
        }
    }

    async shutdown(): Promise<void> {
        await this.securityManager.shutdown();
        await this.militarySecurity.shutdown();
        await this.protocolEconomics.shutdown();
        await this.jupiterIntegration.shutdown();
        await this.steamValidation.shutdown();
        await this.enhancedSteamValidation.shutdown();
        
        this.logger.info('Core system shutdown completed with secure cleanup');
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
    developerApiKey: string;
    openidRealm: string;
    sessionTimeout: number;
}

export interface SecurityConfig {
    rateLimitRequestsPerMinute: number;
    rateLimitBurstSize: number;
    sessionTimeout: number;
    maxVerificationAge: number;
}

export interface UserRegistrationData {
    steamId: string;
    email: string;
    phoneNumber: string;
    mfaToken: string;
    ipAddress: string;
    userAgent: string;
}

export interface UserRegistrationResult {
    success: boolean;
    walletAddress?: string;
    securityLevel?: SecurityLevel;
    steamStanding?: SteamStanding;
    reason?: string;
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
    stakingIncentives?: number;
    transactionHash?: string;
    protocolContribution?: number;
    stakingStats?: ProtocolStakingStats;
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

export { 
    JupiterIntegration, 
    SteamValidation, 
    SecurityManager, 
    MilitarySecurityManager,
    ProtocolEconomics,
    EnhancedSteamValidation,
    SecurityLevel,
    SteamStanding,
    StakingResult,
    UnstakingResult,
    StakingInfo,
    ProtocolStakingStats,
    StakingStatus
};
