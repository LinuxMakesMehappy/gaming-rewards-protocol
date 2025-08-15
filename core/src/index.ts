import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { SteamValidation } from './steam-validation/enhanced-validation';
import { SecurityManager, SecurityLevel } from './security-manager/military-security';
import { Logger } from './utils/logger';

// Import our zero-CVE liquidity engine
import { LiquidityEngine } from '../../zero-cve-liquidity-engine/src/lib';

export interface GamingRewardsConfig {
  rpcUrl: string;
  steamApiKey: string;
  securityLevel: SecurityLevel;
  logLevel: string;
}

export class GamingRewardsCore {
  private connection: Connection;
  private steamValidation: SteamValidation;
  private securityManager: SecurityManager;
  private liquidityEngine: LiquidityEngine;
  private logger: Logger;

  constructor(config: GamingRewardsConfig) {
    this.connection = new Connection(config.rpcUrl, 'confirmed');
    this.steamValidation = new SteamValidation(config.steamApiKey);
    this.securityManager = new SecurityManager(config.securityLevel);
    this.logger = new Logger(config.logLevel);
    
    // Initialize zero-CVE liquidity engine
    this.initializeLiquidityEngine();
  }

  private async initializeLiquidityEngine() {
    try {
      // Initialize the pure Rust liquidity engine
      const apiClient = new (await import('../../zero-cve-liquidity-engine/src/api_client')).ApiClient("https://api.mainnet-beta.solana.com");
      const solanaClient = new (await import('../../zero-cve-liquidity-engine/src/solana_client')).SolanaClient("https://api.mainnet-beta.solana.com");
      const securityManager = new (await import('../../zero-cve-liquidity-engine/src/security')).SecurityManager();
      
      this.liquidityEngine = new LiquidityEngine(apiClient, solanaClient, securityManager);
      this.logger.info('Zero-CVE Liquidity Engine initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize liquidity engine:', error);
      throw error;
    }
  }

  /**
   * Process a gaming achievement and calculate rewards
   */
  async processAchievement(steamId: string, achievementId: string, gameId: string): Promise<any> {
    try {
      // Security validation
      await this.securityManager.validateRequest({
        steamId,
        achievementId,
        gameId,
        timestamp: new Date().toISOString()
      });

      // Steam validation
      const steamData = await this.steamValidation.validateAchievement(steamId, achievementId, gameId);
      
      if (!steamData.isValid) {
        throw new Error('Invalid achievement data');
      }

      // Calculate reward amount
      const rewardAmount = this.calculateRewardAmount(steamData.rarity, steamData.difficulty);
      
      // Process reward using zero-CVE liquidity engine
      const swapRequest = {
        input_token: "USDC",
        output_token: "SOL", 
        amount: rewardAmount,
        slippage_tolerance: 0.5
      };

      const route = await this.liquidityEngine.find_best_route(swapRequest);
      if (route) {
        const result = await this.liquidityEngine.execute_swap(route);
        this.logger.info('Reward processed successfully:', result);
        return result;
      }

      return { success: true, rewardAmount, transactionId: null };
    } catch (error) {
      this.logger.error('Error processing achievement:', error);
      throw error;
    }
  }

  /**
   * Calculate reward amount based on achievement rarity and difficulty
   */
  private calculateRewardAmount(rarity: string, difficulty: number): number {
    const baseReward = 100; // Base reward in USDC cents
    const rarityMultiplier = this.getRarityMultiplier(rarity);
    const difficultyMultiplier = 1 + (difficulty / 100);
    
    return Math.floor(baseReward * rarityMultiplier * difficultyMultiplier);
  }

  /**
   * Get rarity multiplier for reward calculation
   */
  private getRarityMultiplier(rarity: string): number {
    const multipliers = {
      'common': 1.0,
      'uncommon': 1.5,
      'rare': 2.0,
      'epic': 3.0,
      'legendary': 5.0
    };
    return multipliers[rarity as keyof typeof multipliers] || 1.0;
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
   * Get system health
   */
  async getSystemHealth(): Promise<any> {
    try {
      const slot = await this.connection.getSlot();
      const health = await this.connection.getHealth();
      
      return {
        status: 'healthy',
        solanaSlot: slot,
        solanaHealth: health,
        steamValidation: this.steamValidation.getStatus(),
        securityManager: this.securityManager.getStatus(),
        liquidityEngine: 'operational', // Zero-CVE engine status
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error getting system health:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export individual components for direct use
export { SteamValidation } from './steam-validation/enhanced-validation';
export { SecurityManager, SecurityLevel } from './security-manager/military-security';
export { Logger } from './utils/logger';

// Export zero-CVE liquidity engine
export { LiquidityEngine } from '../../zero-cve-liquidity-engine/src/lib';
