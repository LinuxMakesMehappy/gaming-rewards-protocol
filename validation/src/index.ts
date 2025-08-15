import { SteamApiClient } from './steam-api';
import { FraudDetectionSystem } from './fraud-detection';
import { OracleSystem } from './oracle-system';
import { ValidationManager } from './validation-manager';
import { Logger } from './utils/logger';

export class ValidationSystem {
    private steamApi: SteamApiClient;
    private fraudDetection: FraudDetectionSystem;
    private oracleSystem: OracleSystem;
    private validationManager: ValidationManager;
    private logger: Logger;

    constructor(config: ValidationConfig) {
        this.logger = new Logger('ValidationSystem');
        this.steamApi = new SteamApiClient(config.steam);
        this.fraudDetection = new FraudDetectionSystem(config.fraud);
        this.oracleSystem = new OracleSystem(config.oracle);
        this.validationManager = new ValidationManager(config.validation);
        
        this.logger.security('Validation system initialized with zero-CVE policy');
    }

    async initialize(): Promise<void> {
        try {
            await this.steamApi.initialize();
            await this.fraudDetection.initialize();
            await this.oracleSystem.initialize();
            await this.validationManager.initialize();
            
            this.logger.security('Validation system initialization completed');
        } catch (error) {
            this.logger.error('Validation system initialization failed', { error });
            throw error;
        }
    }

    async validateSteamUser(steamId: string, sessionTicket: string): Promise<SteamValidationResult> {
        try {
            this.logger.info('Validating Steam user', { steamId });

            // Steam API validation
            const steamValidation = await this.steamApi.validateUser(steamId, sessionTicket);
            if (!steamValidation.success) {
                return {
                    success: false,
                    reason: 'STEAM_VALIDATION_FAILED',
                    steamData: null,
                    fraudScore: 100
                };
            }

            // Fraud detection check
            const fraudResult = await this.fraudDetection.analyzeUser(steamId, steamValidation.steamData);
            if (fraudResult.fraudDetected) {
                return {
                    success: false,
                    reason: 'FRAUD_DETECTED',
                    steamData: steamValidation.steamData,
                    fraudScore: fraudResult.fraudScore
                };
            }

            // Oracle verification
            const oracleVerification = await this.oracleSystem.verifySteamData(steamId, steamValidation.steamData);
            if (!oracleVerification.verified) {
                return {
                    success: false,
                    reason: 'ORACLE_VERIFICATION_FAILED',
                    steamData: steamValidation.steamData,
                    fraudScore: fraudResult.fraudScore
                };
            }

            this.logger.security('Steam user validation successful', { 
                steamId, 
                fraudScore: fraudResult.fraudScore 
            });

            return {
                success: true,
                steamData: steamValidation.steamData,
                fraudScore: fraudResult.fraudScore,
                oracleVerified: true
            };

        } catch (error) {
            this.logger.error('Steam user validation failed', { error, steamId });
            throw error;
        }
    }

    async validateAchievement(achievement: AchievementValidation): Promise<AchievementValidationResult> {
        try {
            this.logger.info('Validating achievement', { 
                achievementId: achievement.id, 
                steamId: achievement.steamId 
            });

            // Steam achievement verification
            const steamAchievement = await this.steamApi.verifyAchievement(achievement);
            if (!steamAchievement.verified) {
                return {
                    success: false,
                    reason: 'STEAM_ACHIEVEMENT_INVALID',
                    achievementData: null,
                    fraudScore: 100
                };
            }

            // Fraud detection for achievement
            const fraudResult = await this.fraudDetection.analyzeAchievement(achievement);
            if (fraudResult.fraudDetected) {
                return {
                    success: false,
                    reason: 'ACHIEVEMENT_FRAUD_DETECTED',
                    achievementData: steamAchievement.achievementData,
                    fraudScore: fraudResult.fraudScore
                };
            }

            // Oracle verification for achievement
            const oracleVerification = await this.oracleSystem.verifyAchievement(achievement);
            if (!oracleVerification.verified) {
                return {
                    success: false,
                    reason: 'ACHIEVEMENT_ORACLE_FAILED',
                    achievementData: steamAchievement.achievementData,
                    fraudScore: fraudResult.fraudScore
                };
            }

            this.logger.security('Achievement validation successful', { 
                achievementId: achievement.id,
                fraudScore: fraudResult.fraudScore 
            });

            return {
                success: true,
                achievementData: steamAchievement.achievementData,
                fraudScore: fraudResult.fraudScore,
                oracleVerified: true
            };

        } catch (error) {
            this.logger.error('Achievement validation failed', { error, achievement });
            throw error;
        }
    }

    async getFraudReport(steamId: string): Promise<FraudReport> {
        return await this.fraudDetection.generateReport(steamId);
    }

    async getOracleStatus(): Promise<OracleStatus> {
        return await this.oracleSystem.getStatus();
    }

    async shutdown(): Promise<void> {
        await this.steamApi.shutdown();
        await this.fraudDetection.shutdown();
        await this.oracleSystem.shutdown();
        await this.validationManager.shutdown();
        
        this.logger.security('Validation system shutdown completed');
    }
}

export interface ValidationConfig {
    steam: SteamConfig;
    fraud: FraudConfig;
    oracle: OracleConfig;
    validation: ValidationManagerConfig;
}

export interface SteamConfig {
    apiKey: string;
    developerApiKey: string;
    openidRealm: string;
    sessionTimeout: number;
    rateLimitPerMinute: number;
}

export interface FraudConfig {
    maxFraudScore: number;
    suspiciousPatterns: string[];
    blacklistedIps: string[];
    rateLimitPerMinute: number;
}

export interface OracleConfig {
    oracleEndpoints: string[];
    verificationTimeout: number;
    consensusThreshold: number;
}

export interface ValidationManagerConfig {
    maxConcurrentValidations: number;
    validationTimeout: number;
    retryAttempts: number;
}

export interface SteamValidationResult {
    success: boolean;
    steamData?: SteamUserData;
    fraudScore: number;
    oracleVerified?: boolean;
    reason?: string;
}

export interface AchievementValidationResult {
    success: boolean;
    achievementData?: AchievementData;
    fraudScore: number;
    oracleVerified?: boolean;
    reason?: string;
}

export interface SteamUserData {
    steamId: string;
    username: string;
    profileUrl: string;
    avatarUrl: string;
    accountAge: number;
    gameCount: number;
    achievementCount: number;
    standing: SteamStanding;
    lastOnline: number;
}

export interface AchievementData {
    id: string;
    name: string;
    description: string;
    gameId: string;
    gameName: string;
    unlockedAt: number;
    rarity: number;
}

export interface AchievementValidation {
    id: string;
    steamId: string;
    gameId: string;
    timestamp: number;
    sessionTicket: string;
}

export interface FraudReport {
    steamId: string;
    fraudScore: number;
    riskLevel: RiskLevel;
    suspiciousActivities: string[];
    recommendations: string[];
    lastUpdated: number;
}

export interface OracleStatus {
    activeOracles: number;
    totalOracles: number;
    consensusRate: number;
    lastVerification: number;
    healthStatus: HealthStatus;
}

export enum SteamStanding {
    CLEARED = 'CLEARED',
    SUSPICIOUS = 'SUSPICIOUS',
    BLACKLISTED = 'BLACKLISTED',
    INELIGIBLE = 'INELIGIBLE'
}

export enum RiskLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export enum HealthStatus {
    HEALTHY = 'HEALTHY',
    DEGRADED = 'DEGRADED',
    UNHEALTHY = 'UNHEALTHY'
}

export { 
    SteamApiClient, 
    FraudDetectionSystem, 
    OracleSystem, 
    ValidationManager 
};
