'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { GamingRewardsClient, AchievementRarity, UserProfile, Achievement, StakingAccount, ProtocolState } from '../lib/smart-contract';
import { validateSteamId, validateUsername, formatTokenAmount, parseTokenAmount } from '../lib/smart-contract';
import { toast } from 'react-hot-toast';

// Mock reward mint for development (replace with actual mint address)
const MOCK_REWARD_MINT = new PublicKey('11111111111111111111111111111111');

export function useGamingRewards() {
  const { connection } = useConnection();
  const { publicKey, wallet } = useWallet();
  
  const [client, setClient] = useState<GamingRewardsClient | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [protocolState, setProtocolState] = useState<ProtocolState | null>(null);
  const [stakingAccount, setStakingAccount] = useState<StakingAccount | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize client when wallet connects
  useEffect(() => {
    if (publicKey && wallet && connection) {
      const newClient = new GamingRewardsClient(connection, wallet);
      setClient(newClient);
    } else {
      setClient(null);
    }
  }, [publicKey, wallet, connection]);

  // Load user data when client is available
  useEffect(() => {
    if (client && publicKey) {
      loadUserData();
    }
  }, [client, publicKey]);

  // Load all user data
  const loadUserData = useCallback(async () => {
    if (!client || !publicKey) return;

    try {
      setLoading(true);
      setError(null);

      // Load user profile
      const profile = await client.getUserProfile(publicKey);
      setUserProfile(profile);

      // Load protocol state
      const state = await client.getProtocolState();
      setProtocolState(state);

      // Load staking account
      const staking = await client.getStakingAccount(publicKey);
      setStakingAccount(staking);

      // Load token balance
      const balance = await client.getTokenBalance(MOCK_REWARD_MINT, publicKey);
      setTokenBalance(balance);

    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, [client, publicKey]);

  // Register user
  const registerUser = useCallback(async (steamId: string, username: string) => {
    if (!client) {
      toast.error('Wallet not connected');
      return false;
    }

    if (!validateSteamId(steamId)) {
      toast.error('Invalid Steam ID - must be 17 digits');
      return false;
    }

    if (!validateUsername(username)) {
      toast.error('Invalid username - must be 3-32 characters');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await client.registerUser(steamId, username);
      toast.success('User registered successfully!');
      
      // Reload user data
      await loadUserData();
      
      return true;
    } catch (err: any) {
      console.error('Registration failed:', err);
      const errorMessage = err.message || 'Registration failed';
      toast.error(errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, loadUserData]);

  // Claim achievement
  const claimAchievement = useCallback(async (
    achievementId: string,
    achievementName: string,
    gameName: string,
    rarity: AchievementRarity
  ) => {
    if (!client) {
      toast.error('Wallet not connected');
      return false;
    }

    if (!userProfile) {
      toast.error('Please register first');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await client.claimAchievement(
        achievementId,
        achievementName,
        gameName,
        rarity,
        MOCK_REWARD_MINT
      );

      const rewardAmount = client.getRewardAmount(rarity);
      toast.success(`Achievement claimed! +${formatTokenAmount(rewardAmount)} tokens`);
      
      // Reload user data
      await loadUserData();
      
      return true;
    } catch (err: any) {
      console.error('Achievement claiming failed:', err);
      const errorMessage = err.message || 'Achievement claiming failed';
      toast.error(errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, userProfile, loadUserData]);

  // Stake rewards
  const stakeRewards = useCallback(async (amount: number) => {
    if (!client) {
      toast.error('Wallet not connected');
      return false;
    }

    if (!userProfile) {
      toast.error('Please register first');
      return false;
    }

    if (amount <= 0) {
      toast.error('Invalid stake amount');
      return false;
    }

    if (userProfile.totalRewards < amount) {
      toast.error('Insufficient rewards to stake');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await client.stakeRewards(amount, MOCK_REWARD_MINT);
      toast.success(`Staked ${formatTokenAmount(amount)} tokens successfully!`);
      
      // Reload user data
      await loadUserData();
      
      return true;
    } catch (err: any) {
      console.error('Staking failed:', err);
      const errorMessage = err.message || 'Staking failed';
      toast.error(errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, userProfile, loadUserData]);

  // Unstake rewards
  const unstakeRewards = useCallback(async (amount: number) => {
    if (!client) {
      toast.error('Wallet not connected');
      return false;
    }

    if (!stakingAccount) {
      toast.error('No staking account found');
      return false;
    }

    if (amount <= 0) {
      toast.error('Invalid unstake amount');
      return false;
    }

    if (stakingAccount.stakedAmount < amount) {
      toast.error('Insufficient staked amount');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await client.unstakeRewards(amount, MOCK_REWARD_MINT);
      
      // Calculate staking rewards
      const stakingRewards = client.calculateStakingRewards(amount, stakingAccount.stakedAt);
      const totalReturn = amount + stakingRewards;
      
      toast.success(`Unstaked ${formatTokenAmount(amount)} tokens + ${formatTokenAmount(stakingRewards)} rewards!`);
      
      // Reload user data
      await loadUserData();
      
      return true;
    } catch (err: any) {
      console.error('Unstaking failed:', err);
      const errorMessage = err.message || 'Unstaking failed';
      toast.error(errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, stakingAccount, loadUserData]);

  // Update profile
  const updateProfile = useCallback(async (newUsername: string) => {
    if (!client) {
      toast.error('Wallet not connected');
      return false;
    }

    if (!validateUsername(newUsername)) {
      toast.error('Invalid username - must be 3-32 characters');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await client.updateProfile(newUsername);
      toast.success('Profile updated successfully!');
      
      // Reload user data
      await loadUserData();
      
      return true;
    } catch (err: any) {
      console.error('Profile update failed:', err);
      const errorMessage = err.message || 'Profile update failed';
      toast.error(errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [client, loadUserData]);

  // Get achievement
  const getAchievement = useCallback(async (achievementId: string): Promise<Achievement | null> => {
    if (!client || !publicKey) return null;

    try {
      return await client.getAchievement(publicKey, achievementId);
    } catch (err) {
      console.error('Failed to get achievement:', err);
      return null;
    }
  }, [client, publicKey]);

  // Calculate staking rewards
  const calculateStakingRewards = useCallback((amount: number, stakedAt: number): number => {
    if (!client) return 0;
    return client.calculateStakingRewards(amount, stakedAt);
  }, [client]);

  // Get reward amount for rarity
  const getRewardAmount = useCallback((rarity: AchievementRarity): number => {
    if (!client) return 0;
    return client.getRewardAmount(rarity);
  }, [client]);

  // Refresh data
  const refresh = useCallback(() => {
    loadUserData();
  }, [loadUserData]);

  return {
    // State
    userProfile,
    protocolState,
    stakingAccount,
    tokenBalance,
    loading,
    error,
    
    // Actions
    registerUser,
    claimAchievement,
    stakeRewards,
    unstakeRewards,
    updateProfile,
    getAchievement,
    calculateStakingRewards,
    getRewardAmount,
    refresh,
    
    // Utilities
    formatTokenAmount,
    parseTokenAmount,
    validateSteamId,
    validateUsername,
    
    // Constants
    AchievementRarity,
  };
}

// Export AchievementRarity for use in components
export { AchievementRarity };
