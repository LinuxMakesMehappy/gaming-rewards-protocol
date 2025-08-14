import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { Logger } from '../utils/logger';
import { SecurityManager } from '../utils/security-manager';

// =============================================================================
// SECURE YIELD HARVESTER SERVICE
// =============================================================================

export interface HarvestConfig {
    treasuryAddress: PublicKey;
    minHarvestAmount: BN;
    maxHarvestAmount: BN;
    harvestInterval: number;
    oracleAddress: PublicKey;
    botPrivateKey: Uint8Array;
}

export interface HarvestResult {
    success: boolean;
    yieldAmount: BN;
    userShare: BN;
    treasuryShare: BN;
    transactionSignature?: string;
    error?: string;
}

export class YieldHarvester {
    private connection: Connection;
    private program: Program;
    private config: HarvestConfig;
    private logger: Logger;
    private securityManager: SecurityManager;
    private isRunning: boolean = false;
    private lastHarvestTime: number = 0;

    constructor(
        connection: Connection,
        program: Program,
        config: HarvestConfig,
        logger: Logger,
        securityManager: SecurityManager
    ) {
        this.connection = connection;
        this.program = program;
        this.config = config;
        this.logger = logger;
        this.securityManager = securityManager;
    }

    // =============================================================================
    // SECURE HARVESTING OPERATIONS
    // =============================================================================

    /**
     * Start the yield harvesting process
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            this.logger.warn('Yield harvester is already running');
            return;
        }

        this.isRunning = true;
        this.logger.info('Starting secure yield harvester');

        // Validate configuration
        await this.validateConfiguration();

        // Start harvesting loop
        this.startHarvestingLoop();
    }

    /**
     * Stop the yield harvesting process
     */
    public async stop(): Promise<void> {
        this.isRunning = false;
        this.logger.info('Stopping yield harvester');
    }

    /**
     * Check if harvester is running
     */
    public isHarvesterRunning(): boolean {
        return this.isRunning;
    }

    // =============================================================================
    // SECURITY VALIDATION
    // =============================================================================

    /**
     * Validate configuration before starting
     */
    private async validateConfiguration(): Promise<void> {
        try {
            // Validate treasury account exists
            const treasuryInfo = await this.connection.getAccountInfo(this.config.treasuryAddress);
            if (!treasuryInfo) {
                throw new Error('Treasury account not found');
            }

            // Validate oracle account exists
            const oracleInfo = await this.connection.getAccountInfo(this.config.oracleAddress);
            if (!oracleInfo) {
                throw new Error('Oracle account not found');
            }

            // Validate bot has sufficient balance
            const botBalance = await this.connection.getBalance(this.config.oracleAddress);
            if (botBalance < LAMPORTS_PER_SOL) {
                throw new Error('Insufficient bot balance for transactions');
            }

            // Validate harvest amounts
            if (this.config.minHarvestAmount.gte(this.config.maxHarvestAmount)) {
                throw new Error('Invalid harvest amount configuration');
            }

            this.logger.info('Configuration validation passed');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Configuration validation failed', { error: errorMessage });
            throw error;
        }
    }

    // =============================================================================
    // HARVESTING LOGIC
    // =============================================================================

    /**
     * Start the main harvesting loop
     */
    private async startHarvestingLoop(): Promise<void> {
        while (this.isRunning) {
            try {
                await this.performHarvest();
                await this.sleep(this.config.harvestInterval);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error('Harvesting loop error', { error: errorMessage });
                await this.sleep(30000); // Wait 30 seconds before retrying
            }
        }
    }

    /**
     * Perform a single harvest operation
     */
    private async performHarvest(): Promise<HarvestResult> {
        try {
            // Check if enough time has passed since last harvest
            const now = Date.now();
            if (now - this.lastHarvestTime < this.config.harvestInterval) {
                return {
                    success: false,
                    yieldAmount: new BN(0),
                    userShare: new BN(0),
                    treasuryShare: new BN(0),
                    error: 'Harvest interval not met'
                };
            }

            // Calculate available yield
            const availableYield = await this.calculateAvailableYield();
            if (availableYield.lte(this.config.minHarvestAmount)) {
                return {
                    success: false,
                    yieldAmount: new BN(0),
                    userShare: new BN(0),
                    treasuryShare: new BN(0),
                    error: 'Insufficient yield available'
                };
            }

            // Limit harvest amount
            const harvestAmount = BN.min(availableYield, this.config.maxHarvestAmount);

            // Perform secure harvest transaction
            const result = await this.executeHarvestTransaction(harvestAmount);

            if (result.success) {
                this.lastHarvestTime = now;
                this.logger.info('Harvest completed successfully', {
                    yieldAmount: harvestAmount.toString(),
                    userShare: result.userShare.toString(),
                    treasuryShare: result.treasuryShare.toString(),
                    signature: result.transactionSignature
                });
            }

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Harvest operation failed', { error: errorMessage });
            return {
                success: false,
                yieldAmount: new BN(0),
                userShare: new BN(0),
                treasuryShare: new BN(0),
                error: errorMessage
            };
        }
    }

    /**
     * Calculate available yield from staking
     */
    private async calculateAvailableYield(): Promise<BN> {
        try {
            // Get treasury account data
            const treasuryAccount = await this.program.account.treasury.fetch(this.config.treasuryAddress);
            
            // Calculate yield based on staking rewards
            const totalStaked = new BN(treasuryAccount.totalStaked);
            const baseStakingRate = new BN(10); // 10% APY
            const timeSinceLastHarvest = new BN(Date.now() / 1000 - treasuryAccount.lastHarvestTimestamp);
            
            // Calculate yield: (total_staked * rate * time) / (365 * 24 * 3600)
            const annualSeconds = new BN(365 * 24 * 3600);
            const yield = totalStaked.mul(baseStakingRate).mul(timeSinceLastHarvest).div(annualSeconds).div(new BN(100));
            
            return yield;
        } catch (error) {
            this.logger.error('Failed to calculate available yield', { error: error.message });
            return new BN(0);
        }
    }

    /**
     * Execute the harvest transaction on-chain
     */
    private async executeHarvestTransaction(yieldAmount: BN): Promise<HarvestResult> {
        try {
            // Create provider with bot keypair
            const provider = new AnchorProvider(
                this.connection,
                {
                    publicKey: this.config.oracleAddress,
                    signTransaction: async (tx: Transaction) => {
                        // Sign with bot private key
                        tx.partialSign({
                            publicKey: this.config.oracleAddress,
                            secretKey: this.config.botPrivateKey
                        });
                        return tx;
                    },
                    signAllTransactions: async (txs: Transaction[]) => {
                        return txs.map(tx => {
                            tx.partialSign({
                                publicKey: this.config.oracleAddress,
                                secretKey: this.config.botPrivateKey
                            });
                            return tx;
                        });
                    }
                },
                { commitment: 'confirmed' }
            );

            // Create program instance with provider
            const programWithProvider = new Program(this.program.idl, this.program.programId, provider);

            // Calculate distribution (50% to users, 50% to treasury)
            const userShare = yieldAmount.mul(new BN(50)).div(new BN(100));
            const treasuryShare = yieldAmount.sub(userShare);

            // Execute harvest_and_rebalance instruction
            const tx = await programWithProvider.methods
                .harvestAndRebalance(yieldAmount)
                .accounts({
                    treasury: this.config.treasuryAddress,
                    authority: this.config.oracleAddress,
                    systemProgram: SystemProgram.programId
                })
                .rpc({ commitment: 'confirmed' });

            return {
                success: true,
                yieldAmount,
                userShare,
                treasuryShare,
                transactionSignature: tx
            };
        } catch (error) {
            this.logger.error('Harvest transaction failed', { error: error.message });
            return {
                success: false,
                yieldAmount: new BN(0),
                userShare: new BN(0),
                treasuryShare: new BN(0),
                error: error.message
            };
        }
    }

    // =============================================================================
    // SECURITY MONITORING
    // =============================================================================

    /**
     * Monitor treasury health and security
     */
    public async monitorTreasuryHealth(): Promise<void> {
        try {
            const treasuryAccount = await this.program.account.treasury.fetch(this.config.treasuryAddress);
            
            // Check treasury balance
            const treasuryBalance = new BN(treasuryAccount.totalBalance);
            const userRewardsPool = new BN(treasuryAccount.userRewardsPool);
            
            // Alert if treasury is running low
            if (treasuryBalance.lt(new BN(LAMPORTS_PER_SOL * 10))) {
                this.logger.warn('Treasury balance is low', {
                    balance: treasuryBalance.toString(),
                    userRewardsPool: userRewardsPool.toString()
                });
            }

            // Check for suspicious activity
            const totalDistributed = new BN(treasuryAccount.totalDistributed);
            if (totalDistributed.gt(treasuryBalance.mul(new BN(90)).div(new BN(100)))) {
                this.logger.error('Suspicious treasury activity detected', {
                    totalDistributed: totalDistributed.toString(),
                    treasuryBalance: treasuryBalance.toString()
                });
            }

            this.logger.info('Treasury health check completed', {
                balance: treasuryBalance.toString(),
                userRewardsPool: userRewardsPool.toString(),
                totalDistributed: totalDistributed.toString()
            });
        } catch (error) {
            this.logger.error('Treasury health monitoring failed', { error: error.message });
        }
    }

    // =============================================================================
    // UTILITY FUNCTIONS
    // =============================================================================

    /**
     * Sleep for specified milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get harvest statistics
     */
    public async getHarvestStats(): Promise<{
        lastHarvestTime: number;
        isRunning: boolean;
        treasuryAddress: string;
        oracleAddress: string;
    }> {
        return {
            lastHarvestTime: this.lastHarvestTime,
            isRunning: this.isRunning,
            treasuryAddress: this.config.treasuryAddress.toString(),
            oracleAddress: this.config.oracleAddress.toString()
        };
    }
} 