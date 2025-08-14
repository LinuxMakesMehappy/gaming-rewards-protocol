import { Keypair } from '@solana/web3.js';
import { Logger } from './logger';

export class SecurityManager {
    private logger: Logger;
    private rateLimitMap: Map<string, number> = new Map();
    private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
    private readonly MAX_REQUESTS_PER_WINDOW = 100;
    private isTestMode: boolean;

    constructor(logger: Logger) {
        this.logger = logger;
        this.isTestMode = process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';
    }

    async initialize(): Promise<void> {
        this.logger.info('🔐 Initializing security manager...');
        
        // Skip strict validation in test mode
        if (!this.isTestMode) {
            // Validate environment variables
            this.validateEnvironment();
            
            // Validate wallet key
            this.validateWalletKey();
        } else {
            this.logger.info('🧪 Running in test mode - skipping strict validation');
        }
        
        this.logger.info('✅ Security manager initialized');
    }

    private validateEnvironment(): void {
        const requiredEnvVars = [
            'SOLANA_RPC_URL',
            'BOT_PRIVATE_KEY',
            'STEAM_API_KEY',
            'SENTRY_DSN'
        ];

        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }

        this.logger.info('✅ Environment variables validated');
    }

    private validateWalletKey(): void {
        try {
            const privateKey = process.env.BOT_PRIVATE_KEY;
            if (!privateKey) {
                throw new Error('BOT_PRIVATE_KEY not found');
            }

            // Parse and validate the private key
            const keypair = Keypair.fromSecretKey(
                Buffer.from(JSON.parse(privateKey))
            );

            this.logger.info(`✅ Wallet validated: ${keypair.publicKey.toString()}`);
            
        } catch (error) {
            this.logger.error('❌ Invalid wallet key:', error);
            throw error;
        }
    }

    checkRateLimit(identifier: string): boolean {
        const now = Date.now();
        const lastRequest = this.rateLimitMap.get(identifier) || 0;
        
        if (now - lastRequest < this.RATE_LIMIT_WINDOW) {
            this.logger.warn(`Rate limit exceeded for: ${identifier}`);
            return false;
        }
        
        this.rateLimitMap.set(identifier, now);
        return true;
    }

    validateSignature(message: string, signature: string, publicKey: string): boolean {
        try {
            // This would implement actual signature verification
            // For now, return true as placeholder
            return true;
        } catch (error) {
            this.logger.error('Signature validation failed:', error);
            return false;
        }
    }

    sanitizeInput(input: string): string {
        // Basic input sanitization
        return input.replace(/[<>\"'&]/g, '');
    }

    validateAmount(amount: number): boolean {
        return amount > 0 && amount <= Number.MAX_SAFE_INTEGER;
    }

    logSecurityEvent(event: string, details: any): void {
        this.logger.warn(`Security Event: ${event}`, details);
    }
} 