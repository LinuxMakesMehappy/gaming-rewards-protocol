import { Logger } from './utils/logger';
import { FraudConfig, SteamUserData, AchievementValidation } from './index';

export class FraudDetectionSystem {
    private logger: Logger;
    private config: FraudConfig;
    private userHistory: Map<string, UserActivityHistory>;

    constructor(config: FraudConfig) {
        this.config = config;
        this.logger = new Logger('FraudDetectionSystem');
        this.userHistory = new Map();
    }

    async initialize(): Promise<void> {
        this.logger.security('Fraud detection system initialized', { 
            maxFraudScore: this.config.maxFraudScore 
        });
    }

    async analyzeUser(steamId: string, steamData: SteamUserData): Promise<{
        fraudDetected: boolean;
        fraudScore: number;
        riskLevel: string;
        suspiciousActivities: string[];
    }> {
        try {
            this.logger.info('Analyzing user for fraud', { steamId });

            let fraudScore = 0;
            const suspiciousActivities: string[] = [];

            // Check account age
            if (steamData.accountAge < 30) {
                fraudScore += 20;
                suspiciousActivities.push('New account (less than 30 days)');
            }

            // Check game count
            if (steamData.gameCount < 5) {
                fraudScore += 15;
                suspiciousActivities.push('Low game count');
            }

            // Check achievement count
            if (steamData.achievementCount < 10) {
                fraudScore += 10;
                suspiciousActivities.push('Low achievement count');
            }

            // Check account standing
            if (steamData.standing !== 'CLEARED') {
                fraudScore += 50;
                suspiciousActivities.push(`Account standing: ${steamData.standing}`);
            }

            // Check for suspicious patterns
            const patterns = this.detectSuspiciousPatterns(steamId, steamData);
            fraudScore += patterns.score;
            suspiciousActivities.push(...patterns.activities);

            // Check IP blacklist
            if (this.isIpBlacklisted(steamData.steamId)) {
                fraudScore += 100;
                suspiciousActivities.push('IP address blacklisted');
            }

            // Update user history
            this.updateUserHistory(steamId, {
                steamId,
                lastActivity: Date.now(),
                fraudScore,
                suspiciousActivities
            });

            const fraudDetected = fraudScore >= this.config.maxFraudScore;
            const riskLevel = this.calculateRiskLevel(fraudScore);

            this.logger.security('User fraud analysis completed', { 
                steamId, 
                fraudScore, 
                fraudDetected,
                riskLevel 
            });

            return {
                fraudDetected,
                fraudScore,
                riskLevel,
                suspiciousActivities
            };

        } catch (error) {
            this.logger.error('Fraud analysis failed', { error, steamId });
            return {
                fraudDetected: true,
                fraudScore: 100,
                riskLevel: 'CRITICAL',
                suspiciousActivities: ['Analysis failed']
            };
        }
    }

    async analyzeAchievement(achievement: AchievementValidation): Promise<{
        fraudDetected: boolean;
        fraudScore: number;
        riskLevel: string;
        suspiciousActivities: string[];
    }> {
        try {
            this.logger.info('Analyzing achievement for fraud', { 
                achievementId: achievement.id, 
                steamId: achievement.steamId 
            });

            let fraudScore = 0;
            const suspiciousActivities: string[] = [];

            // Check timestamp validity
            const currentTime = Date.now();
            const timeDiff = currentTime - achievement.timestamp;
            
            if (timeDiff < 0 || timeDiff > 300000) { // 5 minutes
                fraudScore += 30;
                suspiciousActivities.push('Invalid achievement timestamp');
            }

            // Check for rapid achievement unlocking
            const userHistory = this.userHistory.get(achievement.steamId);
            if (userHistory) {
                const recentAchievements = userHistory.recentAchievements || [];
                const timeSinceLastAchievement = recentAchievements.length > 0 
                    ? currentTime - recentAchievements[recentAchievements.length - 1].timestamp
                    : Infinity;

                if (timeSinceLastAchievement < 60000) { // 1 minute
                    fraudScore += 25;
                    suspiciousActivities.push('Rapid achievement unlocking');
                }
            }

            // Check for duplicate achievements
            if (this.isDuplicateAchievement(achievement)) {
                fraudScore += 50;
                suspiciousActivities.push('Duplicate achievement detected');
            }

            // Check for impossible achievements
            if (this.isImpossibleAchievement(achievement)) {
                fraudScore += 100;
                suspiciousActivities.push('Impossible achievement detected');
            }

            const fraudDetected = fraudScore >= this.config.maxFraudScore;
            const riskLevel = this.calculateRiskLevel(fraudScore);

            this.logger.security('Achievement fraud analysis completed', { 
                achievementId: achievement.id,
                fraudScore, 
                fraudDetected,
                riskLevel 
            });

            return {
                fraudDetected,
                fraudScore,
                riskLevel,
                suspiciousActivities
            };

        } catch (error) {
            this.logger.error('Achievement fraud analysis failed', { error, achievement });
            return {
                fraudDetected: true,
                fraudScore: 100,
                riskLevel: 'CRITICAL',
                suspiciousActivities: ['Analysis failed']
            };
        }
    }

    async generateReport(steamId: string): Promise<{
        steamId: string;
        fraudScore: number;
        riskLevel: string;
        suspiciousActivities: string[];
        recommendations: string[];
        lastUpdated: number;
    }> {
        const userHistory = this.userHistory.get(steamId);
        
        if (!userHistory) {
            return {
                steamId,
                fraudScore: 0,
                riskLevel: 'UNKNOWN',
                suspiciousActivities: [],
                recommendations: ['No activity history found'],
                lastUpdated: Date.now()
            };
        }

        const recommendations = this.generateRecommendations(userHistory.fraudScore);

        return {
            steamId,
            fraudScore: userHistory.fraudScore,
            riskLevel: this.calculateRiskLevel(userHistory.fraudScore),
            suspiciousActivities: userHistory.suspiciousActivities,
            recommendations,
            lastUpdated: userHistory.lastActivity
        };
    }

    private detectSuspiciousPatterns(steamId: string, steamData: SteamUserData): {
        score: number;
        activities: string[];
    } {
        let score = 0;
        const activities: string[] = [];

        // Check for suspicious username patterns
        if (this.hasSuspiciousUsername(steamData.username)) {
            score += 15;
            activities.push('Suspicious username pattern');
        }

        // Check for account creation patterns
        if (this.hasSuspiciousCreationPattern(steamData)) {
            score += 20;
            activities.push('Suspicious account creation pattern');
        }

        // Check for activity patterns
        if (this.hasSuspiciousActivityPattern(steamId)) {
            score += 25;
            activities.push('Suspicious activity pattern');
        }

        return { score, activities };
    }

    private hasSuspiciousUsername(username: string): boolean {
        const suspiciousPatterns = [
            /^[0-9]+$/, // All numbers
            /^[a-z]{1,2}$/, // Very short
            /(hack|cheat|bot|fake|test)/i, // Suspicious keywords
        ];

        return suspiciousPatterns.some(pattern => pattern.test(username));
    }

    private hasSuspiciousCreationPattern(steamData: SteamUserData): boolean {
        // Check if account was created recently with high activity
        const isNewAccount = steamData.accountAge < 7;
        const hasHighActivity = steamData.achievementCount > 50;
        
        return isNewAccount && hasHighActivity;
    }

    private hasSuspiciousActivityPattern(steamId: string): boolean {
        const userHistory = this.userHistory.get(steamId);
        if (!userHistory) return false;

        // Check for unusual activity patterns
        const recentActivities = userHistory.recentAchievements || [];
        if (recentActivities.length < 3) return false;

        // Check for too many achievements in short time
        const timeSpan = recentActivities[recentActivities.length - 1].timestamp - 
                        recentActivities[0].timestamp;
        const achievementsPerHour = (recentActivities.length * 3600000) / timeSpan;

        return achievementsPerHour > 10; // More than 10 achievements per hour
    }

    private isIpBlacklisted(steamId: string): boolean {
        // Simplified check - in production, this would check actual IP addresses
        return this.config.blacklistedIps.includes(steamId);
    }

    private isDuplicateAchievement(achievement: AchievementValidation): boolean {
        const userHistory = this.userHistory.get(achievement.steamId);
        if (!userHistory) return false;

        const recentAchievements = userHistory.recentAchievements || [];
        return recentAchievements.some(a => a.id === achievement.id);
    }

    private isImpossibleAchievement(achievement: AchievementValidation): boolean {
        // Check for achievements that shouldn't be possible
        const impossibleAchievements = [
            'impossible_achievement',
            'test_achievement',
            'debug_achievement'
        ];

        return impossibleAchievements.includes(achievement.id);
    }

    private calculateRiskLevel(fraudScore: number): string {
        if (fraudScore >= 80) return 'CRITICAL';
        if (fraudScore >= 60) return 'HIGH';
        if (fraudScore >= 40) return 'MEDIUM';
        if (fraudScore >= 20) return 'LOW';
        return 'MINIMAL';
    }

    private generateRecommendations(fraudScore: number): string[] {
        const recommendations: string[] = [];

        if (fraudScore >= 80) {
            recommendations.push('Account flagged for manual review');
            recommendations.push('Consider temporary suspension');
        } else if (fraudScore >= 60) {
            recommendations.push('Monitor account activity closely');
            recommendations.push('Require additional verification');
        } else if (fraudScore >= 40) {
            recommendations.push('Flag for enhanced monitoring');
        } else if (fraudScore >= 20) {
            recommendations.push('Continue normal monitoring');
        } else {
            recommendations.push('Account appears legitimate');
        }

        return recommendations;
    }

    private updateUserHistory(steamId: string, activity: UserActivityHistory): void {
        const existing = this.userHistory.get(steamId);
        
        if (existing) {
            existing.lastActivity = activity.lastActivity;
            existing.fraudScore = activity.fraudScore;
            existing.suspiciousActivities = activity.suspiciousActivities;
            
            // Update recent achievements
            if (!existing.recentAchievements) {
                existing.recentAchievements = [];
            }
            
            // Keep only last 10 achievements
            if (existing.recentAchievements.length >= 10) {
                existing.recentAchievements.shift();
            }
        } else {
            this.userHistory.set(steamId, {
                ...activity,
                recentAchievements: []
            });
        }
    }

    async shutdown(): Promise<void> {
        this.logger.security('Fraud detection system shutdown completed');
    }
}

interface UserActivityHistory {
    steamId: string;
    lastActivity: number;
    fraudScore: number;
    suspiciousActivities: string[];
    recentAchievements?: Array<{
        id: string;
        timestamp: number;
    }>;
}
