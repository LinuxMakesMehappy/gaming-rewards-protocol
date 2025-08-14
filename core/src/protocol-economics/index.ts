import { Logger } from '../utils/logger';
import { UserStakingManager } from './user-staking';

export class ProtocolEconomics {
    private logger: Logger;
    private totalRewards: number;
    private userRewardsPool: number;
    private protocolOperationsPool: number;
    private startingCapital: number;
    private userStakingManager: UserStakingManager;

    constructor() {
        this.logger = new Logger('ProtocolEconomics');
        this.startingCapital = 1_000_000_000; // 1 SOL in lamports
        this.totalRewards = 0;
        this.userRewardsPool = 0;
        this.protocolOperationsPool = 0;
        this.userStakingManager = new UserStakingManager();
    }

    async initialize(): Promise<void> {
        await this.userStakingManager.initialize();
        this.logger.info('Protocol economics initialized with user staking', { 
            startingCapital: this.startingCapital,
            distributionModel: 'Enhanced 50/50 split with user staking'
        });
    }

    async distributeRewards(totalAmount: number): Promise<RewardDistribution> {
        try {
            this.logger.info('Distributing rewards with enhanced tokenomics', { totalAmount });

            // Enhanced distribution (50% users, 50% protocol)
            const userShare = Math.floor(totalAmount * 0.5);
            const protocolShare = totalAmount - userShare;

            // Split user share between instant claims and staking incentives
            const instantClaims = Math.floor(userShare * 0.6); // 30% of total (60% of user share)
            const stakingIncentives = userShare - instantClaims; // 20% of total (40% of user share)

            // Update pools
            this.userRewardsPool += userShare;
            this.protocolOperationsPool += protocolShare;
            this.totalRewards += totalAmount;

            // Allocate protocol share to operations
            const operationsAllocation = this.allocateProtocolOperations(protocolShare);

            // Get staking statistics
            const stakingStats = await this.userStakingManager.getProtocolStakingStats();

            this.logger.info('Enhanced rewards distributed successfully', {
                userShare,
                instantClaims,
                stakingIncentives,
                protocolShare,
                operationsAllocation,
                totalStaked: stakingStats.totalStaked,
                liquidityIncrease: stakingStats.protocolLiquidityIncrease
            });

            return {
                userRewards: userShare,
                instantClaims,
                stakingIncentives,
                protocolOperations: protocolShare,
                operationsBreakdown: operationsAllocation,
                stakingStats
            };

        } catch (error) {
            this.logger.error('Reward distribution failed', { error, totalAmount });
            throw error;
        }
    }

    async processUserStaking(userAddress: string, amount: number): Promise<StakingResult> {
        return await this.userStakingManager.stakeRewards(userAddress, amount);
    }

    async processUserUnstaking(userAddress: string, stakeId: string): Promise<UnstakingResult> {
        return await this.userStakingManager.unstakeRewards(userAddress, stakeId);
    }

    async getUserStakingInfo(userAddress: string): Promise<StakingInfo> {
        return await this.userStakingManager.getStakingInfo(userAddress);
    }

    private allocateProtocolOperations(protocolShare: number): OperationsAllocation {
        return {
            vpsHosting: Math.floor(protocolShare * 0.4), // 20% of total
            securityInfrastructure: Math.floor(protocolShare * 0.3), // 15% of total
            developmentFund: Math.floor(protocolShare * 0.2), // 10% of total
            emergencyReserve: Math.floor(protocolShare * 0.1) // 5% of total
        };
    }

    async calculateSustainabilityMetrics(): Promise<SustainabilityMetrics> {
        const monthlyExpenses = this.calculateMonthlyExpenses();
        const monthlyRevenue = this.calculateMonthlyRevenue();
        const sustainabilityRatio = monthlyRevenue / monthlyExpenses;
        const stakingStats = await this.userStakingManager.getProtocolStakingStats();

        return {
            monthlyExpenses,
            monthlyRevenue,
            sustainabilityRatio,
            isSelfSustaining: sustainabilityRatio >= 1.0,
            runwayMonths: this.calculateRunway(monthlyExpenses, monthlyRevenue),
            stakingContribution: stakingStats.protocolLiquidityIncrease,
            totalStaked: stakingStats.totalStaked
        };
    }

    private calculateMonthlyExpenses(): number {
        // VPS hosting, security infrastructure, development costs
        return 100_000_000; // 0.1 SOL per month
    }

    private calculateMonthlyRevenue(): number {
        // Jupiter swap fees + protocol fees + staking rewards
        const baseRevenue = 150_000_000; // 0.15 SOL per month
        const stakingMultiplier = 1.2; // 20% increase from staking liquidity
        
        return Math.floor(baseRevenue * stakingMultiplier);
    }

    private calculateRunway(expenses: number, revenue: number): number {
        const netMonthly = revenue - expenses;
        if (netMonthly <= 0) return 0;
        return Math.floor(this.startingCapital / netMonthly);
    }

    async getProtocolStatus(): Promise<ProtocolStatus> {
        const sustainability = await this.calculateSustainabilityMetrics();
        const stakingStats = await this.userStakingManager.getProtocolStakingStats();
        
        return {
            totalRewards: this.totalRewards,
            userRewardsPool: this.userRewardsPool,
            protocolOperationsPool: this.protocolOperationsPool,
            sustainabilityMetrics: sustainability,
            stakingStats,
            transparencyLevel: 'FULL',
            passphraseStatus: 'BURNED'
        };
    }

    async shutdown(): Promise<void> {
        await this.userStakingManager.shutdown();
        this.logger.info('Protocol economics shutdown completed');
    }
}

export interface RewardDistribution {
    userRewards: number;
    instantClaims: number;
    stakingIncentives: number;
    protocolOperations: number;
    operationsBreakdown: OperationsAllocation;
    stakingStats: ProtocolStakingStats;
}

export interface OperationsAllocation {
    vpsHosting: number;
    securityInfrastructure: number;
    developmentFund: number;
    emergencyReserve: number;
}

export interface SustainabilityMetrics {
    monthlyExpenses: number;
    monthlyRevenue: number;
    sustainabilityRatio: number;
    isSelfSustaining: boolean;
    runwayMonths: number;
    stakingContribution: number;
    totalStaked: number;
}

export interface ProtocolStatus {
    totalRewards: number;
    userRewardsPool: number;
    protocolOperationsPool: number;
    sustainabilityMetrics: SustainabilityMetrics;
    stakingStats: ProtocolStakingStats;
    transparencyLevel: string;
    passphraseStatus: string;
}

// Re-export staking interfaces
export { 
    UserStakingManager,
    StakingResult,
    UnstakingResult,
    StakingInfo,
    ProtocolStakingStats,
    StakingStatus
};
