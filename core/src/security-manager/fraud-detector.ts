import { Logger } from '../utils/logger';
import { Achievement } from '../index';

export class FraudDetector {
    private logger: Logger;
    private userReputations: Map<string, number>;
    private suspiciousPatterns: Set<string>;

    constructor() {
        this.logger = new Logger('FraudDetector');
        this.userReputations = new Map();
        this.suspiciousPatterns = new Set();
    }

    async initialize(): Promise<void> {
        this.logger.security('Fraud detector initialized');
    }

    async checkUser(steamId: string, walletAddress: string): Promise<boolean> {
        // Check for suspicious patterns
        const pattern = `${steamId}:${walletAddress}`;
        if (this.suspiciousPatterns.has(pattern)) {
            this.logger.security('Suspicious pattern detected', { steamId, walletAddress });
            return true;
        }

        // Check user reputation
        const reputation = this.userReputations.get(steamId) || 0;
        if (reputation < -50) {
            this.logger.security('Low reputation user detected', { steamId, reputation });
            return true;
        }

        return false;
    }

    async checkReward(achievement: Achievement, userAddress: string): Promise<boolean> {
        // Check for achievement farming patterns
        const achievementPattern = `${achievement.id}:${userAddress}`;
        if (this.suspiciousPatterns.has(achievementPattern)) {
            this.logger.security('Suspicious achievement pattern detected', { 
                achievementId: achievement.id, 
                userAddress 
            });
            return true;
        }

        // Check achievement timestamp validity
        const currentTime = Date.now();
        const timeDiff = currentTime - achievement.timestamp;
        
        if (timeDiff < 0 || timeDiff > 24 * 60 * 60 * 1000) { // 24 hours
            this.logger.security('Invalid achievement timestamp', { 
                achievementId: achievement.id, 
                timeDiff 
            });
            return true;
        }

        return false;
    }

    getUserReputation(steamId: string): number {
        return this.userReputations.get(steamId) || 0;
    }

    updateUserReputation(steamId: string, delta: number): void {
        const current = this.userReputations.get(steamId) || 0;
        const newReputation = Math.max(-100, Math.min(100, current + delta));
        this.userReputations.set(steamId, newReputation);
        
        this.logger.security('User reputation updated', { steamId, newReputation });
    }

    markSuspiciousPattern(pattern: string): void {
        this.suspiciousPatterns.add(pattern);
        this.logger.security('Suspicious pattern marked', { pattern });
    }

    async shutdown(): Promise<void> {
        this.userReputations.clear();
        this.suspiciousPatterns.clear();
        this.logger.security('Fraud detector shutdown completed');
    }
}
