import { Connection, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { GamingRewardsProtocol, IDL } from './idl/gaming_rewards_protocol';

// Program ID from smart contracts
const PROGRAM_ID = new PublicKey('9NDb1c8ANjRXaD45HZi16khQH2cLPngdiCos1gR6gsDc');

// Achievement rarity enum
export enum AchievementRarity {
  Common = 'common',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary',
}

// User profile interface
export interface UserProfile {
  user: PublicKey;
  steamId: string;
  username: string;
  totalAchievements: number;
  totalRewards: number;
  stakedAmount: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Achievement interface
export interface Achievement {
  achievementId: string;
  achievementName: string;
  gameName: string;
  rarity: AchievementRarity;
  rewardAmount: number;
  isClaimed: boolean;
  claimedAt: number;
}

// Staking account interface
export interface StakingAccount {
  user: PublicKey;
  stakedAmount: number;
  stakedAt: number;
  isActive: boolean;
}

// Protocol state interface
export interface ProtocolState {
  authority: PublicKey;
  rewardMint: PublicKey;
  totalUsers: number;
  totalAchievementsClaimed: number;
  totalRewardsDistributed: number;
}

// Smart contract client class
export class GamingRewardsClient {
  private program: Program<GamingRewardsProtocol>;
  private connection: Connection;
  private provider: AnchorProvider;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
    this.program = new Program(IDL, PROGRAM_ID, this.provider);
  }

  // Get PDA for protocol state
  async getProtocolStatePda(): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('protocol_state')],
      this.program.programId
    );
  }

  // Get PDA for user profile
  async getUserProfilePda(user: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user_profile'), user.toBuffer()],
      this.program.programId
    );
  }

  // Get PDA for achievement
  async getAchievementPda(user: PublicKey, achievementId: string): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('achievement'),
        user.toBuffer(),
        Buffer.from(achievementId),
      ],
      this.program.programId
    );
  }

  // Get PDA for staking account
  async getStakingAccountPda(user: PublicKey): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('staking'), user.toBuffer()],
      this.program.programId
    );
  }

  // Initialize the protocol
  async initializeProtocol(rewardMint: PublicKey): Promise<string> {
    try {
      const [protocolStatePda] = await this.getProtocolStatePda();
      const [protocolTokenAccount] = await getAssociatedTokenAddress(
        rewardMint,
        protocolStatePda,
        true
      );

      const tx = await this.program.methods
        .initialize()
        .accounts({
          protocolState: protocolStatePda,
          rewardMint: rewardMint,
          authority: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✅ Protocol initialized:', tx);
      return tx;
    } catch (error) {
      console.error('❌ Protocol initialization failed:', error);
      throw error;
    }
  }

  // Register a new user
  async registerUser(steamId: string, username: string): Promise<string> {
    try {
      const [userProfilePda] = await this.getUserProfilePda(this.provider.wallet.publicKey);
      const [protocolStatePda] = await this.getProtocolStatePda();

      const tx = await this.program.methods
        .registerUser(steamId, username)
        .accounts({
          userProfile: userProfilePda,
          protocolState: protocolStatePda,
          user: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('✅ User registered:', tx);
      return tx;
    } catch (error) {
      console.error('❌ User registration failed:', error);
      throw error;
    }
  }

  // Claim an achievement
  async claimAchievement(
    achievementId: string,
    achievementName: string,
    gameName: string,
    rarity: AchievementRarity,
    rewardMint: PublicKey
  ): Promise<string> {
    try {
      const [achievementPda] = await this.getAchievementPda(
        this.provider.wallet.publicKey,
        achievementId
      );
      const [userProfilePda] = await this.getUserProfilePda(this.provider.wallet.publicKey);
      const [protocolStatePda] = await this.getProtocolStatePda();
      const [protocolTokenAccount] = await getAssociatedTokenAddress(
        rewardMint,
        protocolStatePda,
        true
      );
      const [userTokenAccount] = await getAssociatedTokenAddress(
        rewardMint,
        this.provider.wallet.publicKey
      );

      const tx = await this.program.methods
        .claimAchievement(achievementId, achievementName, gameName, { [rarity]: {} })
        .accounts({
          achievement: achievementPda,
          userProfile: userProfilePda,
          protocolState: protocolStatePda,
          protocolTokenAccount: protocolTokenAccount,
          userTokenAccount: userTokenAccount,
          rewardMint: rewardMint,
          user: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✅ Achievement claimed:', tx);
      return tx;
    } catch (error) {
      console.error('❌ Achievement claiming failed:', error);
      throw error;
    }
  }

  // Stake rewards
  async stakeRewards(amount: number, rewardMint: PublicKey): Promise<string> {
    try {
      const [stakingAccountPda] = await this.getStakingAccountPda(this.provider.wallet.publicKey);
      const [userProfilePda] = await this.getUserProfilePda(this.provider.wallet.publicKey);
      const [userTokenAccount] = await getAssociatedTokenAddress(
        rewardMint,
        this.provider.wallet.publicKey
      );
      const [stakingTokenAccount] = await getAssociatedTokenAddress(
        rewardMint,
        stakingAccountPda,
        true
      );

      const tx = await this.program.methods
        .stakeRewards(new BN(amount))
        .accounts({
          stakingAccount: stakingAccountPda,
          userProfile: userProfilePda,
          userTokenAccount: userTokenAccount,
          stakingTokenAccount: stakingTokenAccount,
          rewardMint: rewardMint,
          user: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✅ Rewards staked:', tx);
      return tx;
    } catch (error) {
      console.error('❌ Staking failed:', error);
      throw error;
    }
  }

  // Unstake rewards
  async unstakeRewards(amount: number, rewardMint: PublicKey): Promise<string> {
    try {
      const [stakingAccountPda] = await this.getStakingAccountPda(this.provider.wallet.publicKey);
      const [userProfilePda] = await this.getUserProfilePda(this.provider.wallet.publicKey);
      const [userTokenAccount] = await getAssociatedTokenAddress(
        rewardMint,
        this.provider.wallet.publicKey
      );
      const [stakingTokenAccount] = await getAssociatedTokenAddress(
        rewardMint,
        stakingAccountPda,
        true
      );

      const tx = await this.program.methods
        .unstakeRewards(new BN(amount))
        .accounts({
          stakingAccount: stakingAccountPda,
          userProfile: userProfilePda,
          userTokenAccount: userTokenAccount,
          stakingTokenAccount: stakingTokenAccount,
          rewardMint: rewardMint,
          user: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log('✅ Rewards unstaked:', tx);
      return tx;
    } catch (error) {
      console.error('❌ Unstaking failed:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(newUsername: string): Promise<string> {
    try {
      const [userProfilePda] = await this.getUserProfilePda(this.provider.wallet.publicKey);

      const tx = await this.program.methods
        .updateProfile(newUsername)
        .accounts({
          userProfile: userProfilePda,
          user: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('✅ Profile updated:', tx);
      return tx;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  }

  // Fetch user profile
  async getUserProfile(user: PublicKey): Promise<UserProfile | null> {
    try {
      const [userProfilePda] = await this.getUserProfilePda(user);
      const profile = await this.program.account.userProfile.fetch(userProfilePda);
      
      return {
        user: profile.user,
        steamId: profile.steamId,
        username: profile.username,
        totalAchievements: profile.totalAchievements.toNumber(),
        totalRewards: profile.totalRewards.toNumber(),
        stakedAmount: profile.stakedAmount.toNumber(),
        isActive: profile.isActive,
        createdAt: profile.createdAt.toNumber(),
        updatedAt: profile.updatedAt.toNumber(),
      };
    } catch (error) {
      console.log('User profile not found');
      return null;
    }
  }

  // Fetch achievement
  async getAchievement(user: PublicKey, achievementId: string): Promise<Achievement | null> {
    try {
      const [achievementPda] = await this.getAchievementPda(user, achievementId);
      const achievement = await this.program.account.achievement.fetch(achievementPda);
      
      return {
        achievementId: achievement.achievementId,
        achievementName: achievement.achievementName,
        gameName: achievement.gameName,
        rarity: achievement.rarity as AchievementRarity,
        rewardAmount: achievement.rewardAmount.toNumber(),
        isClaimed: achievement.isClaimed,
        claimedAt: achievement.claimedAt.toNumber(),
      };
    } catch (error) {
      console.log('Achievement not found');
      return null;
    }
  }

  // Fetch staking account
  async getStakingAccount(user: PublicKey): Promise<StakingAccount | null> {
    try {
      const [stakingAccountPda] = await this.getStakingAccountPda(user);
      const staking = await this.program.account.stakingAccount.fetch(stakingAccountPda);
      
      return {
        user: staking.user,
        stakedAmount: staking.stakedAmount.toNumber(),
        stakedAt: staking.stakedAt.toNumber(),
        isActive: staking.isActive,
      };
    } catch (error) {
      console.log('Staking account not found');
      return null;
    }
  }

  // Fetch protocol state
  async getProtocolState(): Promise<ProtocolState | null> {
    try {
      const [protocolStatePda] = await this.getProtocolStatePda();
      const state = await this.program.account.protocolState.fetch(protocolStatePda);
      
      return {
        authority: state.authority,
        rewardMint: state.rewardMint,
        totalUsers: state.totalUsers.toNumber(),
        totalAchievementsClaimed: state.totalAchievementsClaimed.toNumber(),
        totalRewardsDistributed: state.totalRewardsDistributed.toNumber(),
      };
    } catch (error) {
      console.log('Protocol state not found');
      return null;
    }
  }

  // Get token balance
  async getTokenBalance(mint: PublicKey, owner: PublicKey): Promise<number> {
    try {
      const [tokenAccount] = await getAssociatedTokenAddress(mint, owner);
      const account = await this.connection.getTokenAccountBalance(tokenAccount);
      return Number(account.value.amount);
    } catch (error) {
      console.log('Token account not found');
      return 0;
    }
  }

  // Calculate staking rewards
  calculateStakingRewards(stakedAmount: number, stakedAt: number): number {
    const now = Date.now() / 1000;
    const stakingDuration = now - stakedAt;
    const daysStaked = stakingDuration / 86400; // 86400 seconds per day
    const stakingReward = (stakedAmount * 5 * daysStaked) / (100 * 365); // 5% APY
    return Math.floor(stakingReward);
  }

  // Get reward amount for rarity
  getRewardAmount(rarity: AchievementRarity): number {
    switch (rarity) {
      case AchievementRarity.Common:
        return 100;
      case AchievementRarity.Rare:
        return 250;
      case AchievementRarity.Epic:
        return 500;
      case AchievementRarity.Legendary:
        return 1000;
      default:
        return 100;
    }
  }
}

// Utility functions
export const validateSteamId = (steamId: string): boolean => {
  return steamId.length === 17 && /^\d+$/.test(steamId);
};

export const validateUsername = (username: string): boolean => {
  return username.length >= 3 && username.length <= 32;
};

export const formatTokenAmount = (amount: number): string => {
  return (amount / 1e9).toFixed(2);
};

export const parseTokenAmount = (amount: string): number => {
  return Math.floor(parseFloat(amount) * 1e9);
};
