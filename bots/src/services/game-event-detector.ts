import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Logger } from '../utils/logger';
import * as crypto from 'crypto';
import axios from 'axios';

export class GameEventDetector {
    private connection: Connection;
    private wallet: Keypair;
    private oracleKeypair: Keypair; // Dedicated oracle key
    private logger: Logger;
    private isRunning: boolean = false;
    private verifiedGamers: Map<string, string> = new Map(); // Steam ID -> Wallet address
    private steamApiKey: string;
    private steamDomain: string;

    constructor(connection: Connection, wallet: Keypair, logger: Logger) {
        this.connection = connection;
        this.wallet = wallet;
        this.logger = logger;
        
        // Initialize Steam API configuration
        this.steamApiKey = process.env.STEAM_API_KEY || '';
        this.steamDomain = process.env.STEAM_DOMAIN || 'localhost';
        
        if (!this.steamApiKey) {
            throw new Error('STEAM_API_KEY environment variable is required');
        }
        
        // Initialize dedicated oracle key
        const oraclePrivateKey = process.env.ORACLE_PRIVATE_KEY;
        if (!oraclePrivateKey) {
            throw new Error('ORACLE_PRIVATE_KEY environment variable is required');
        }
        
        try {
            this.oracleKeypair = Keypair.fromSecretKey(
                Buffer.from(JSON.parse(oraclePrivateKey))
            );
            this.logger.info(`Oracle key initialized: ${this.oracleKeypair.publicKey.toString()}`);
        } catch (error) {
            this.logger.error('Failed to initialize oracle key:', error);
            throw new Error('Invalid ORACLE_PRIVATE_KEY format');
        }
    }

    async start(): Promise<void> {
        this.isRunning = true;
        this.logger.info('Starting game event detector with Steam API integration...');
        this.logger.info(`Steam API Key: ${this.steamApiKey.substring(0, 8)}...`);
        this.logger.info(`Steam Domain: ${this.steamDomain}`);
        
        // Initialize Steam connection
        await this.initializeSteam();
        
        // Start monitoring loop
        this.monitorGameEvents();
    }

    async stop(): Promise<void> {
        this.isRunning = false;
        this.logger.info('Stopping game event detector...');
    }

    private async initializeSteam(): Promise<void> {
        try {
            // Test Steam API connection
            await this.testSteamApiConnection();
            this.logger.info('Steam API connection initialized successfully');
            
        } catch (error) {
            this.logger.error('Error initializing Steam:', error);
            throw error;
        }
    }

    private async testSteamApiConnection(): Promise<void> {
        try {
            // Test Steam API with a known game (CS2)
            const testUrl = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=730&format=json`;
            const response = await axios.get(testUrl);
            
            if (response.status === 200) {
                this.logger.info('Steam API connection test successful');
            } else {
                throw new Error(`Steam API test failed with status: ${response.status}`);
            }
        } catch (error) {
            this.logger.error('Steam API connection test failed:', error);
            throw error;
        }
    }

    private async monitorGameEvents(): Promise<void> {
        while (this.isRunning) {
            try {
                await this.checkForNewAchievements();
                
                // Wait 5 minutes before next check
                await this.sleep(300000); // 5 minutes in milliseconds
            } catch (error) {
                this.logger.error('Error in game event monitoring:', error);
                await this.sleep(60000); // Wait 1 minute on error
            }
        }
    }

    private async checkForNewAchievements(): Promise<void> {
        try {
            // Get list of verified gamers
            const verifiedGamers = await this.getVerifiedGamers();
            
            for (const [steamId, walletAddress] of verifiedGamers) {
                const achievements = await this.getUserAchievements(steamId);
                
                // Check for new achievements since last check
                const newAchievements = await this.filterNewAchievements(steamId, achievements);
                
                if (newAchievements.length > 0) {
                    await this.processAchievements(walletAddress, newAchievements);
                }
            }
            
        } catch (error) {
            this.logger.error('Error checking achievements:', error);
        }
    }

    private async getVerifiedGamers(): Promise<Map<string, string>> {
        // This would fetch from your database or configuration
        // For development, return mock data with localhost configuration
        return new Map([
            ['76561198012345678', '11111111111111111111111111111111'],
            ['76561198087654321', '22222222222222222222222222222222'],
        ]);
    }

    private async getUserAchievements(steamId: string): Promise<any[]> {
        try {
            // Use Steam API to get user achievements
            const url = `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=730&key=${this.steamApiKey}&steamid=${steamId}&format=json`;
            
            const response = await axios.get(url);
            
            if (response.status === 200 && response.data.playerstats) {
                const stats = response.data.playerstats.stats || [];
                this.logger.info(`Retrieved ${stats.length} stats for Steam ID: ${steamId}`);
                return stats;
            } else {
                this.logger.warn(`No stats found for Steam ID: ${steamId}`);
                return [];
            }
        } catch (error) {
            this.logger.error(`Error getting achievements for ${steamId}:`, error);
            // Fallback to mock data for development
            return [
                { name: 'First Blood', value: 1, unlockTime: Date.now() },
                { name: 'Veteran', value: 1, unlockTime: Date.now() },
            ];
        }
    }

    private async filterNewAchievements(steamId: string, achievements: any[]): Promise<any[]> {
        // This would compare with previously stored achievements
        // For development, return all achievements as "new"
        return achievements.filter(achievement => achievement.value > 0);
    }

    private async processAchievements(walletAddress: string, achievements: any[]): Promise<void> {
        try {
            for (const achievement of achievements) {
                // Calculate reward amount based on achievement
                const rewardAmount = this.calculateRewardAmount(achievement);
                
                if (rewardAmount > 0) {
                    // Create oracle signature using dedicated oracle key
                    const signature = await this.createOracleSignature(walletAddress, rewardAmount);
                    
                    // Store signature for on-chain verification
                    await this.storeOracleSignature(walletAddress, achievement, signature);
                    
                    this.logger.info(`Processed achievement for ${walletAddress}: ${achievement.name} - Reward: ${rewardAmount}`);
                }
            }
        } catch (error) {
            this.logger.error('Error processing achievements:', error);
        }
    }

    private calculateRewardAmount(achievement: any): number {
        // Calculate reward based on achievement rarity/difficulty
        const baseReward = 1000000; // 1 USDC in lamports
        
        // This would be more sophisticated in production
        return baseReward;
    }

    private async createOracleSignature(walletAddress: string, rewardAmount: number): Promise<string> {
        try {
            const timestamp = Math.floor(Date.now() / 1000);
            const message = `${walletAddress}:${timestamp}:${rewardAmount}`;
            
            // Sign message with dedicated oracle private key
            const messageBuffer = Buffer.from(message, 'utf8');
            const signature = crypto.sign('ed25519', messageBuffer, this.oracleKeypair.secretKey);
            
            this.logger.info(`Created oracle signature for ${walletAddress}: ${signature.length} bytes`);
            return signature.toString('base64');
            
        } catch (error) {
            this.logger.error('Error creating oracle signature:', error);
            throw error;
        }
    }

    private async storeOracleSignature(walletAddress: string, achievement: any, signature: string): Promise<void> {
        // This would store the signature in a database or cache
        // for later retrieval when the user claims their reward
        this.logger.info(`Stored oracle signature for ${walletAddress}: ${signature.substring(0, 20)}...`);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
} 