import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { EnhancedSteamValidation } from './steam-validation/enhanced-validation';
import { MilitarySecurityManager, SecurityLevel } from './security-manager/military-security';
import { Logger } from './utils/logger';

export interface GamingRewardsConfig {
  rpcUrl: string;
  steamApiKey: string;
  securityLevel: SecurityLevel;
  logLevel: string;
}

export class GamingRewardsCore {
  private connection: Connection;
  private steamValidation: EnhancedSteamValidation;
  private securityManager: MilitarySecurityManager;
  private logger: Logger;

  constructor(config: GamingRewardsConfig) {
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    this.steamValidation = new EnhancedSteamValidation(config.steamApiKey, config.steamApiKey);
    this.securityManager = new MilitarySecurityManager();
    this.logger = new Logger(config.logLevel);
  }

  /**
   * Process a gaming achievement and calculate rewards
   */
  async processAchievement(steamId: string, achievementId: string, gameId: string): Promise<any> {
    try {
      // Security validation - using user identity validation
      const userData = {
        steamId,
        phoneNumber: '', // Would be provided in real implementation
        email: '', // Would be provided in real implementation
        mfaToken: '', // Would be provided in real implementation
        ipAddress: '127.0.0.1', // Would be provided in real implementation
        userAgent: 'GamingRewardsCore/1.0' // Would be provided in real implementation
      };
      
      const securityResult = await this.securityManager.validateUserIdentity(userData);
      if (!securityResult.success) {
        throw new Error(`Security validation failed: ${securityResult.securityLevel}`);
      }

      // Steam validation
      const steamData = await this.steamValidation.validateUserStanding(steamId);
      
      if (!steamData.isValid) {
        throw new Error(`Invalid Steam user: ${steamData.reason}`);
      }

      // Calculate reward amount based on standing
      const rewardAmount = this.calculateRewardAmount(steamData.standing, 50); // Default difficulty
      
      this.logger.info('Achievement processed successfully', {
        steamId,
        achievementId,
        gameId,
        rewardAmount,
        standing: steamData.standing,
        securityLevel: securityResult.securityLevel
      });

      return { 
        success: true, 
        rewardAmount, 
        steamData,
        securityResult,
        transactionId: null 
      };
    } catch (error) {
      this.logger.error('Error processing achievement:', error);
      throw error;
    }
  }

  /**
   * Calculate reward amount based on achievement rarity and difficulty
   */
  private calculateRewardAmount(standing: any, difficulty: number): number {
    const baseReward = 100; // Base reward in USDC cents
    const standingMultiplier = this.getStandingMultiplier(standing);
    const difficultyMultiplier = 1 + (difficulty / 100);
    
    return Math.floor(baseReward * standingMultiplier * difficultyMultiplier);
  }

  /**
   * Get multiplier based on Steam standing
   */
  private getStandingMultiplier(standing: any): number {
    switch (standing) {
      case 'CLEARED':
        return 1.0;
      case 'SUSPICIOUS':
        return 0.5;
      case 'BLACKLISTED':
        return 0.0;
      default:
        return 0.8;
    }
  }

  /**
   * Get user's reward balance
   */
  async getRewardBalance(userId: string): Promise<any> {
    try {
      const userPubkey = new PublicKey(userId);
      const balance = await this.connection.getBalance(userPubkey);
      
      return {
        userId,
        balance: balance / 1e9, // Convert lamports to SOL
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error getting reward balance:', error);
      throw error;
    }
  }

  /**
   * Get security status
   */
  getSecurityStatus(): any {
    return {
      securityLevel: this.securityManager.getSecurityLevel(),
      lastAudit: this.securityManager.getLastAudit(),
      activeThreats: this.securityManager.getActiveThreats(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<any> {
    try {
      const connectionStatus = await this.connection.getVersion();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        components: {
          connection: 'connected',
          steamValidation: 'initialized',
          securityManager: 'active'
        },
        version: connectionStatus
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export individual components for direct use
export { EnhancedSteamValidation } from './steam-validation/enhanced-validation';
export { MilitarySecurityManager, SecurityLevel } from './security-manager/military-security';
export { Logger } from './utils/logger';
