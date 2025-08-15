// WASM Loader for Gaming Rewards Protocol
// Handles loading and initialization of Rust WASM core

import init, {
  init_gaming_rewards,
  get_version,
  get_security_status,
  SteamValidator,
  SecurityManager,
  RewardEngine,
  StakingManager,
  FraudDetector,
  SteamUserWasm,
  AchievementWasm,
  RewardWasm,
  StakingPositionWasm,
} from '../../../gaming-rewards-core/pkg/gaming_rewards_core';

export interface WasmCore {
  version: string;
  securityStatus: any;
  steamValidator: SteamValidator;
  securityManager: SecurityManager;
  rewardEngine: RewardEngine;
  stakingManager: StakingManager;
  fraudDetector: FraudDetector;
}

class WasmLoader {
  private static instance: WasmLoader;
  private wasmCore: WasmCore | null = null;
  private isLoading = false;
  private loadPromise: Promise<WasmCore> | null = null;

  private constructor() {}

  static getInstance(): WasmLoader {
    if (!WasmLoader.instance) {
      WasmLoader.instance = new WasmLoader();
    }
    return WasmLoader.instance;
  }

  async load(): Promise<WasmCore> {
    if (this.wasmCore) {
      return this.wasmCore;
    }

    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = this.initializeWasm();
    
    try {
      this.wasmCore = await this.loadPromise;
      return this.wasmCore;
    } catch (error) {
      this.isLoading = false;
      this.loadPromise = null;
      throw error;
    }
  }

  private async initializeWasm(): Promise<WasmCore> {
    try {
      console.log('🚀 Initializing Gaming Rewards WASM Core...');
      
      // Initialize the WASM module
      await init();
      
      // Initialize the gaming rewards system
      await init_gaming_rewards();
      
      // Get version and security status
      const version = get_version();
      const securityStatus = get_security_status();
      
      console.log(`✅ WASM Core loaded successfully - Version: ${version}`);
      
      // Create core components
      const steamValidator = new SteamValidator('demo-api-key');
      const securityManager = new SecurityManager();
      const rewardEngine = new RewardEngine();
      const stakingManager = new StakingManager();
      const fraudDetector = new FraudDetector();
      
      const core: WasmCore = {
        version,
        securityStatus,
        steamValidator,
        securityManager,
        rewardEngine,
        stakingManager,
        fraudDetector,
      };
      
      console.log('🔒 Security Core Components Initialized:');
      console.log('- Steam Validator:', !!steamValidator);
      console.log('- Security Manager:', !!securityManager);
      console.log('- Reward Engine:', !!rewardEngine);
      console.log('- Staking Manager:', !!stakingManager);
      console.log('- Fraud Detector:', !!fraudDetector);
      
      return core;
    } catch (error) {
      console.error('❌ Failed to initialize WASM Core:', error);
      throw new Error(`WASM initialization failed: ${error}`);
    }
  }

  getCore(): WasmCore | null {
    return this.wasmCore;
  }

  isLoaded(): boolean {
    return this.wasmCore !== null;
  }

  async reload(): Promise<WasmCore> {
    this.wasmCore = null;
    this.isLoading = false;
    this.loadPromise = null;
    return this.load();
  }
}

// Export singleton instance
export const wasmLoader = WasmLoader.getInstance();

// Export convenience functions
export const loadWasmCore = () => wasmLoader.load();
export const getWasmCore = () => wasmLoader.getCore();
export const isWasmLoaded = () => wasmLoader.isLoaded();
