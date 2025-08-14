import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { config } from 'dotenv';
import * as Sentry from '@sentry/node';
import { Logger } from './utils/logger';
import { YieldHarvester } from './services/yield-harvester';
import { GameEventDetector } from './services/game-event-detector';
import { SecurityManager } from './utils/security-manager';

// Load environment variables
config();

// Initialize Sentry
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
});

class GamingRewardsBot {
    private connection: Connection;
    private wallet: Keypair;
    private logger: Logger;
    private yieldHarvester: YieldHarvester;
    private gameEventDetector: GameEventDetector;
    private securityManager: SecurityManager;

    constructor() {
        this.connection = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');
        this.wallet = Keypair.fromSecretKey(
            Buffer.from(JSON.parse(process.env.BOT_PRIVATE_KEY!))
        );
        this.logger = new Logger();
        this.securityManager = new SecurityManager(this.logger);
        this.yieldHarvester = new YieldHarvester(this.connection, this.wallet, this.logger);
        this.gameEventDetector = new GameEventDetector(this.connection, this.wallet, this.logger);
    }

    async start() {
        try {
            this.logger.info('Starting Gaming Rewards Bot...');
            
            // Initialize security checks
            await this.securityManager.initialize();
            
            // Start yield harvesting
            await this.yieldHarvester.start();
            
            // Start game event detection
            await this.gameEventDetector.start();
            
            this.logger.info('Bot started successfully');
            
            // Keep the process alive
            process.on('SIGINT', async () => {
                this.logger.info('Shutting down bot...');
                await this.yieldHarvester.stop();
                await this.gameEventDetector.stop();
                process.exit(0);
            });
            
        } catch (error) {
            this.logger.error('Failed to start bot:', error);
            Sentry.captureException(error);
            process.exit(1);
        }
    }
}

// Start the bot
if (require.main === module) {
    const bot = new GamingRewardsBot();
    bot.start().catch((error) => {
        console.error('Bot startup failed:', error);
        Sentry.captureException(error);
        process.exit(1);
    });
}

export { GamingRewardsBot }; 