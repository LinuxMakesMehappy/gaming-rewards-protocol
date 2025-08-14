import { Logger } from '../utils/logger';

export class ProtocolEconomics {
    private logger: Logger;
    private totalRewards: number;
    private userRewardsPool: number;
    private protocolOperationsPool: number;
    private startingCapital: number;

    constructor() {
        this.logger = new Logger('ProtocolEconomics');
        this.startingCapital = 1_000_000_000; // 1 SOL in lamports
        this.totalRewards = 0;
        this.userRewardsPool = 0;
        this.protocolOperationsPool = 0;
    }

    async initialize(): Promise<void> {
        this.logger.info('Protocol economics initialized', { 
            startingCapital: this.startingCapital,
            distributionModel: '50/50 split'
        });
    }

    async distributeRewards(totalAmount: number): Promise<RewardDistribution> {
        try {
            this.logger.info('Distributing rewards', { totalAmount });

            // Calculate distribution (50% users, 50% protocol)
            const userShare = Math.floor(totalAmount * 0.5);
            const protocolShare = totalAmount - userShare;

            // Update pools
            this.userRewardsPool += userShare;
            this.protocolOperationsPool += protocolShare;
            this.totalRewards += totalAmount;

            // Allocate protocol share to operations
            const operationsAllocation = this.allocateProtocolOperations(protocolShare);

            this.logger.info('Rewards distributed successfully', {
                userShare,
                protocolShare,
                operationsAllocation
            });

            return {
                userRewards: userShare,
                protocolOperations: protocolShare,
                operationsBreakdown: operationsAllocation
            };

        } catch (error) {
            this.logger.error('Reward distribution failed', { error, totalAmount });
            throw error;
        }
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

        return {
            monthlyExpenses,
            monthlyRevenue,
            sustainabilityRatio,
            isSelfSustaining: sustainabilityRatio >= 1.0,
            runwayMonths: this.calculateRunway(monthlyExpenses, monthlyRevenue)
        };
    }

    private calculateMonthlyExpenses(): number {
        // VPS hosting, security infrastructure, development costs
        return 100_000_000; // 0.1 SOL per month
    }

    private calculateMonthlyRevenue(): number {
        // Jupiter swap fees + protocol fees
        return 150_000_000; // 0.15 SOL per month
    }

    private calculateRunway(expenses: number, revenue: number): number {
        const netMonthly = revenue - expenses;
        if (netMonthly <= 0) return 0;
        return Math.floor(this.startingCapital / netMonthly);
    }

    async getProtocolStatus(): Promise<ProtocolStatus> {
        const sustainability = await this.calculateSustainabilityMetrics();
        
        return {
            totalRewards: this.totalRewards,
            userRewardsPool: this.userRewardsPool,
            protocolOperationsPool: this.protocolOperationsPool,
            sustainabilityMetrics: sustainability,
            transparencyLevel: 'FULL',
            passphraseStatus: 'BURNED'
        };
    }

    async shutdown(): Promise<void> {
        this.logger.info('Protocol economics shutdown completed');
    }
}

export interface RewardDistribution {
    userRewards: number;
    protocolOperations: number;
    operationsBreakdown: OperationsAllocation;
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
}

export interface ProtocolStatus {
    totalRewards: number;
    userRewardsPool: number;
    protocolOperationsPool: number;
    sustainabilityMetrics: SustainabilityMetrics;
    transparencyLevel: string;
    passphraseStatus: string;
}
