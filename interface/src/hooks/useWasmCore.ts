import { useState, useEffect, useCallback } from 'react';
import { wasmLoader, WasmCore } from '../wasm/wasm-loader';

export interface UseWasmCoreReturn {
  core: WasmCore | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const useWasmCore = (): UseWasmCoreReturn => {
  const [core, setCore] = useState<WasmCore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCore = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const wasmCore = await wasmLoader.load();
      setCore(wasmCore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load WASM core');
      console.error('WASM Core loading error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    await loadCore();
  }, [loadCore]);

  useEffect(() => {
    loadCore();
  }, [loadCore]);

  return {
    core,
    loading,
    error,
    reload,
  };
};

// Specialized hooks for specific WASM functionality
export const useSteamValidation = () => {
  const { core, loading, error } = useWasmCore();

  const validateSteamUser = useCallback(async (steamId: string) => {
    if (!core?.steamValidator) {
      throw new Error('Steam validator not available');
    }
    return await core.steamValidator.validate_user(steamId);
  }, [core]);

  const validateAchievement = useCallback(async (achievementId: string, steamId: string) => {
    if (!core?.steamValidator) {
      throw new Error('Steam validator not available');
    }
    return await core.steamValidator.validate_achievement(achievementId, steamId);
  }, [core]);

  return {
    validateSteamUser,
    validateAchievement,
    loading,
    error,
  };
};

export const useSecurityManager = () => {
  const { core, loading, error } = useWasmCore();

  const createSession = useCallback(async (userId: string) => {
    if (!core?.securityManager) {
      throw new Error('Security manager not available');
    }
    return await core.securityManager.create_session(userId);
  }, [core]);

  const validateSession = useCallback(async (sessionId: string) => {
    if (!core?.securityManager) {
      throw new Error('Security manager not available');
    }
    return await core.securityManager.validate_session(sessionId);
  }, [core]);

  const encryptData = useCallback(async (data: string) => {
    if (!core?.securityManager) {
      throw new Error('Security manager not available');
    }
    return await core.securityManager.encrypt_data(data);
  }, [core]);

  const decryptData = useCallback(async (encryptedData: string) => {
    if (!core?.securityManager) {
      throw new Error('Security manager not available');
    }
    return await core.securityManager.decrypt_data(encryptedData);
  }, [core]);

  return {
    createSession,
    validateSession,
    encryptData,
    decryptData,
    loading,
    error,
  };
};

export const useRewardEngine = () => {
  const { core, loading, error } = useWasmCore();

  const calculateReward = useCallback(async (achievementId: string, rarity: number) => {
    if (!core?.rewardEngine) {
      throw new Error('Reward engine not available');
    }
    return await core.rewardEngine.calculate_reward(achievementId, rarity);
  }, [core]);

  const createReward = useCallback(async (amount: number, currency: string, achievementId?: string) => {
    if (!core?.rewardEngine) {
      throw new Error('Reward engine not available');
    }
    return await core.rewardEngine.create_reward(amount, currency, achievementId);
  }, [core]);

  const processClaim = useCallback(async (rewardId: string) => {
    if (!core?.rewardEngine) {
      throw new Error('Reward engine not available');
    }
    return await core.rewardEngine.process_claim(rewardId);
  }, [core]);

  return {
    calculateReward,
    createReward,
    processClaim,
    loading,
    error,
  };
};

export const useStakingManager = () => {
  const { core, loading, error } = useWasmCore();

  const createStakingPosition = useCallback(async (amount: number, lockPeriod: number) => {
    if (!core?.stakingManager) {
      throw new Error('Staking manager not available');
    }
    return await core.stakingManager.create_staking_position(amount, lockPeriod);
  }, [core]);

  const calculateRewards = useCallback(async (stakeId: string) => {
    if (!core?.stakingManager) {
      throw new Error('Staking manager not available');
    }
    return await core.stakingManager.calculate_rewards(stakeId);
  }, [core]);

  const unstakePosition = useCallback(async (stakeId: string) => {
    if (!core?.stakingManager) {
      throw new Error('Staking manager not available');
    }
    return await core.stakingManager.unstake_position(stakeId);
  }, [core]);

  return {
    createStakingPosition,
    calculateRewards,
    unstakePosition,
    loading,
    error,
  };
};

export const useFraudDetection = () => {
  const { core, loading, error } = useWasmCore();

  const analyzeUser = useCallback(async (steamId: string) => {
    if (!core?.fraudDetector) {
      throw new Error('Fraud detector not available');
    }
    return await core.fraudDetector.analyze_user(steamId);
  }, [core]);

  const isFraudulent = useCallback(async (steamId: string) => {
    if (!core?.fraudDetector) {
      throw new Error('Fraud detector not available');
    }
    return await core.fraudDetector.is_fraudulent(steamId);
  }, [core]);

  const getRiskDescription = useCallback(async (steamId: string) => {
    if (!core?.fraudDetector) {
      throw new Error('Fraud detector not available');
    }
    return await core.fraudDetector.get_risk_description(steamId);
  }, [core]);

  return {
    analyzeUser,
    isFraudulent,
    getRiskDescription,
    loading,
    error,
  };
};
