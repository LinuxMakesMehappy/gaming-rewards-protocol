import { Logger } from '../utils/logger';

export class UserStakingManager {
    private logger: Logger;
    private stakingPools: Map<string, StakingPool>;
    private totalStaked: number;
    private stakingRewards: number;
    private lockPeriod: number; // 30 days in milliseconds

    constructor() {
        this.logger = new Logger('UserStakingManager');
        this.stakingPools = new Map();
        this.totalStaked = 0;
        this.stakingRewards = 0;
        this.lockPeriod = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    async initialize(): Promise<void> {
        this.logger.info('User staking manager initialized', {
            lockPeriod: '30 days',
            bonusMultiplier: '1.5x',
            compoundInterest: 'enabled'
        });
    }

    async stakeRewards(userAddress: string, amount: number): Promise<StakingResult> {
        try {
            this.logger.info('Processing user staking request', { userAddress, amount });

            // Validate staking amount
            if (amount <= 0) {
                return {
                    success: false,
                    reason: 'INVALID_AMOUNT',
                    error: 'Staking amount must be greater than 0'
                };
            }

            // Create or update staking pool
            const pool = this.getOrCreateStakingPool(userAddress);
            const stakeId = this.generateStakeId(userAddress);
            
            const stake: UserStake = {
                id: stakeId,
                userAddress,
                amount,
                stakedAt: Date.now(),
                unlockAt: Date.now() + this.lockPeriod,
                bonusMultiplier: 1.5,
                compoundInterest: true,
                status: StakingStatus.ACTIVE
            };

            pool.stakes.push(stake);
            pool.totalStaked += amount;
            this.totalStaked += amount;

            this.logger.info('User staking successful', {
                userAddress,
                stakeId,
                amount,
                unlockAt: new Date(stake.unlockAt).toISOString(),
                bonusMultiplier: stake.bonusMultiplier
            });

            return {
                success: true,
                stakeId,
                amount,
                unlockAt: stake.unlockAt,
                bonusMultiplier: stake.bonusMultiplier,
                estimatedReward: this.calculateEstimatedReward(stake)
            };

        } catch (error) {
            this.logger.error('User staking failed', { error, userAddress, amount });
            return {
                success: false,
                reason: 'STAKING_ERROR',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async unstakeRewards(userAddress: string, stakeId: string): Promise<UnstakingResult> {
        try {
            this.logger.info('Processing user unstaking request', { userAddress, stakeId });

            const pool = this.stakingPools.get(userAddress);
            if (!pool) {
                return {
                    success: false,
                    reason: 'NO_STAKING_POOL',
                    error: 'No staking pool found for user'
                };
            }

            const stakeIndex = pool.stakes.findIndex(s => s.id === stakeId);
            if (stakeIndex === -1) {
                return {
                    success: false,
                    reason: 'STAKE_NOT_FOUND',
                    error: 'Stake not found'
                };
            }

            const stake = pool.stakes[stakeIndex];
            
            // Check if lock period has passed
            if (Date.now() < stake.unlockAt) {
                const remainingTime = stake.unlockAt - Date.now();
                const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000));
                
                return {
                    success: false,
                    reason: 'LOCK_PERIOD_ACTIVE',
                    error: `Stake is locked for ${remainingDays} more days`,
                    remainingDays
                };
            }

            // Calculate rewards with bonus
            const rewards = this.calculateStakingRewards(stake);
            const totalAmount = stake.amount + rewards;

            // Remove stake from pool
            pool.stakes.splice(stakeIndex, 1);
            pool.totalStaked -= stake.amount;
            this.totalStaked -= stake.amount;
            this.stakingRewards += rewards;

            this.logger.info('User unstaking successful', {
                userAddress,
                stakeId,
                originalAmount: stake.amount,
                rewards,
                totalAmount
            });

            return {
                success: true,
                stakeId,
                originalAmount: stake.amount,
                rewards,
                totalAmount,
                stakingDuration: Date.now() - stake.stakedAt
            };

        } catch (error) {
            this.logger.error('User unstaking failed', { error, userAddress, stakeId });
            return {
                success: false,
                reason: 'UNSTAKING_ERROR',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async getStakingInfo(userAddress: string): Promise<StakingInfo> {
        const pool = this.stakingPools.get(userAddress);
        if (!pool) {
            return {
                totalStaked: 0,
                activeStakes: 0,
                totalRewards: 0,
                stakes: []
            };
        }

        const activeStakes = pool.stakes.filter(s => s.status === StakingStatus.ACTIVE);
        const totalRewards = activeStakes.reduce((sum, stake) => 
            sum + this.calculateStakingRewards(stake), 0
        );

        return {
            totalStaked: pool.totalStaked,
            activeStakes: activeStakes.length,
            totalRewards,
            stakes: activeStakes.map(stake => ({
                id: stake.id,
                amount: stake.amount,
                stakedAt: stake.stakedAt,
                unlockAt: stake.unlockAt,
                currentRewards: this.calculateStakingRewards(stake),
                status: stake.status
            }))
        };
    }

    async getProtocolStakingStats(): Promise<ProtocolStakingStats> {
        const totalUsers = this.stakingPools.size;
        const totalStakes = Array.from(this.stakingPools.values())
            .reduce((sum, pool) => sum + pool.stakes.length, 0);

        return {
            totalStaked: this.totalStaked,
            totalStakingRewards: this.stakingRewards,
            totalUsers,
            totalStakes,
            averageStakeAmount: totalStakes > 0 ? this.totalStaked / totalStakes : 0,
            protocolLiquidityIncrease: this.calculateLiquidityIncrease()
        };
    }

    private getOrCreateStakingPool(userAddress: string): StakingPool {
        if (!this.stakingPools.has(userAddress)) {
            this.stakingPools.set(userAddress, {
                userAddress,
                totalStaked: 0,
                stakes: []
            });
        }
        return this.stakingPools.get(userAddress)!;
    }

    private generateStakeId(userAddress: string): string {
        return `${userAddress}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private calculateStakingRewards(stake: UserStake): number {
        const stakingDuration = Date.now() - stake.stakedAt;
        const daysStaked = stakingDuration / (24 * 60 * 60 * 1000);
        
        // Base reward rate: 5% APY
        const baseRate = 0.05;
        const dailyRate = baseRate / 365;
        
        // Apply bonus multiplier for 30-day lock
        const effectiveRate = dailyRate * stake.bonusMultiplier;
        
        // Calculate compound interest
        const rewards = stake.amount * Math.pow(1 + effectiveRate, daysStaked) - stake.amount;
        
        return Math.max(0, rewards);
    }

    private calculateEstimatedReward(stake: UserStake): number {
        // Estimate rewards for 30-day period
        const estimatedDays = 30;
        const baseRate = 0.05;
        const dailyRate = baseRate / 365;
        const effectiveRate = dailyRate * stake.bonusMultiplier;
        
        return stake.amount * Math.pow(1 + effectiveRate, estimatedDays) - stake.amount;
    }

    private calculateLiquidityIncrease(): number {
        // Calculate how much the protocol's liquidity has increased due to staking
        const baseLiquidity = 1_000_000_000; // 1 SOL starting capital
        return ((this.totalStaked / baseLiquidity) * 100);
    }

    async shutdown(): Promise<void> {
        this.logger.info('User staking manager shutdown completed');
    }
}

export enum StakingStatus {
    ACTIVE = 'ACTIVE',
    UNLOCKED = 'UNLOCKED',
    WITHDRAWN = 'WITHDRAWN'
}

export interface UserStake {
    id: string;
    userAddress: string;
    amount: number;
    stakedAt: number;
    unlockAt: number;
    bonusMultiplier: number;
    compoundInterest: boolean;
    status: StakingStatus;
}

export interface StakingPool {
    userAddress: string;
    totalStaked: number;
    stakes: UserStake[];
}

export interface StakingResult {
    success: boolean;
    stakeId?: string;
    amount?: number;
    unlockAt?: number;
    bonusMultiplier?: number;
    estimatedReward?: number;
    reason?: string;
    error?: string;
}

export interface UnstakingResult {
    success: boolean;
    stakeId?: string;
    originalAmount?: number;
    rewards?: number;
    totalAmount?: number;
    stakingDuration?: number;
    remainingDays?: number;
    reason?: string;
    error?: string;
}

export interface StakingInfo {
    totalStaked: number;
    activeStakes: number;
    totalRewards: number;
    stakes: {
        id: string;
        amount: number;
        stakedAt: number;
        unlockAt: number;
        currentRewards: number;
        status: StakingStatus;
    }[];
}

export interface ProtocolStakingStats {
    totalStaked: number;
    totalStakingRewards: number;
    totalUsers: number;
    totalStakes: number;
    averageStakeAmount: number;
    protocolLiquidityIncrease: number;
}
