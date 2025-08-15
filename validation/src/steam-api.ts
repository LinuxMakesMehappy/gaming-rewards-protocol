import axios from 'axios';
import { Logger } from './utils/logger';
import { SteamConfig, SteamUserData, AchievementData, AchievementValidation } from './index';

export class SteamApiClient {
    private logger: Logger;
    private config: SteamConfig;

    constructor(config: SteamConfig) {
        this.config = config;
        this.logger = new Logger('SteamApiClient');
    }

    async initialize(): Promise<void> {
        this.logger.security('Steam API client initialized', { 
            openidRealm: this.config.openidRealm 
        });
    }

    async validateUser(steamId: string, sessionTicket: string): Promise<{
        success: boolean;
        steamData?: SteamUserData;
        reason?: string;
    }> {
        try {
            this.logger.info('Validating Steam user', { steamId });

            // Validate Steam ID format
            if (!this.isValidSteamId(steamId)) {
                return {
                    success: false,
                    reason: 'INVALID_STEAM_ID_FORMAT'
                };
            }

            // Get user profile data
            const userData = await this.getUserProfile(steamId);
            if (!userData) {
                return {
                    success: false,
                    reason: 'USER_NOT_FOUND'
                };
            }

            // Validate session ticket (simplified for demo)
            const sessionValid = await this.validateSessionTicket(sessionTicket, steamId);
            if (!sessionValid) {
                return {
                    success: false,
                    reason: 'INVALID_SESSION_TICKET'
                };
            }

            this.logger.security('Steam user validation successful', { steamId });

            return {
                success: true,
                steamData: userData
            };

        } catch (error) {
            this.logger.error('Steam user validation failed', { error, steamId });
            return {
                success: false,
                reason: 'API_ERROR'
            };
        }
    }

    async verifyAchievement(achievement: AchievementValidation): Promise<{
        verified: boolean;
        achievementData?: AchievementData;
        reason?: string;
    }> {
        try {
            this.logger.info('Verifying Steam achievement', { 
                achievementId: achievement.id, 
                steamId: achievement.steamId 
            });

            // Validate achievement format
            if (!this.isValidAchievement(achievement)) {
                return {
                    verified: false,
                    reason: 'INVALID_ACHIEVEMENT_FORMAT'
                };
            }

            // Get achievement data from Steam API
            const achievementData = await this.getAchievementData(
                achievement.steamId, 
                achievement.gameId, 
                achievement.id
            );

            if (!achievementData) {
                return {
                    verified: false,
                    reason: 'ACHIEVEMENT_NOT_FOUND'
                };
            }

            // Validate timestamp
            const currentTime = Date.now();
            const ageThreshold = this.config.sessionTimeout * 1000;
            
            if (currentTime - achievement.timestamp > ageThreshold) {
                return {
                    verified: false,
                    reason: 'ACHIEVEMENT_TOO_OLD'
                };
            }

            this.logger.security('Achievement verification successful', { 
                achievementId: achievement.id 
            });

            return {
                verified: true,
                achievementData
            };

        } catch (error) {
            this.logger.error('Achievement verification failed', { error, achievement });
            return {
                verified: false,
                reason: 'API_ERROR'
            };
        }
    }

    private async getUserProfile(steamId: string): Promise<SteamUserData | null> {
        try {
            const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`;
            const params = {
                key: this.config.apiKey,
                steamids: steamId,
                format: 'json'
            };

            const response = await axios.get(url, { params });
            
            if (response.status !== 200 || !response.data.response?.players?.[0]) {
                return null;
            }

            const player = response.data.response.players[0];
            
            // Get additional user stats
            const stats = await this.getUserStats(steamId);
            
            return {
                steamId,
                username: player.personaname,
                profileUrl: player.profileurl,
                avatarUrl: player.avatarfull,
                accountAge: this.calculateAccountAge(player.timecreated),
                gameCount: stats.gameCount,
                achievementCount: stats.achievementCount,
                standing: stats.standing,
                lastOnline: player.lastlogoff
            };

        } catch (error) {
            this.logger.error('Failed to get user profile', { error, steamId });
            return null;
        }
    }

    private async getUserStats(steamId: string): Promise<{
        gameCount: number;
        achievementCount: number;
        standing: any;
    }> {
        try {
            // Get owned games
            const gamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`;
            const gamesParams = {
                key: this.config.apiKey,
                steamid: steamId,
                include_appinfo: 1,
                format: 'json'
            };

            const gamesResponse = await axios.get(gamesUrl, { params: gamesParams });
            const gameCount = gamesResponse.data.response?.game_count || 0;

            // Get achievement count (simplified)
            const achievementCount = gameCount * 10; // Mock calculation

            // Get account standing (simplified)
            const standing = 'CLEARED'; // Mock standing

            return {
                gameCount,
                achievementCount,
                standing
            };

        } catch (error) {
            this.logger.error('Failed to get user stats', { error, steamId });
            return {
                gameCount: 0,
                achievementCount: 0,
                standing: 'UNKNOWN'
            };
        }
    }

    private async getAchievementData(
        steamId: string, 
        gameId: string, 
        achievementId: string
    ): Promise<AchievementData | null> {
        try {
            const url = `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/`;
            const params = {
                appid: gameId,
                key: this.config.apiKey,
                steamid: steamId,
                format: 'json'
            };

            const response = await axios.get(url, { params });
            
            if (response.status !== 200 || !response.data.playerstats) {
                return null;
            }

            const stats = response.data.playerstats.stats || [];
            const achievement = stats.find((stat: any) => stat.name === achievementId);
            
            if (!achievement) {
                return null;
            }

            return {
                id: achievementId,
                name: achievementId,
                description: `Achievement: ${achievementId}`,
                gameId,
                gameName: this.getGameName(gameId),
                unlockedAt: Date.now(),
                rarity: this.calculateRarity(achievement.value)
            };

        } catch (error) {
            this.logger.error('Failed to get achievement data', { error, steamId, achievementId });
            return null;
        }
    }

    private async validateSessionTicket(sessionTicket: string, steamId: string): Promise<boolean> {
        // Simplified session validation for demo
        // In production, this would validate the actual Steam session ticket
        return sessionTicket.length > 0 && steamId.length === 17;
    }

    private isValidSteamId(steamId: string): boolean {
        return /^[0-9]{17}$/.test(steamId);
    }

    private isValidAchievement(achievement: AchievementValidation): boolean {
        return !!(achievement.id && 
                 achievement.steamId && 
                 achievement.gameId && 
                 achievement.timestamp > 0);
    }

    private calculateAccountAge(timeCreated: number): number {
        const currentTime = Math.floor(Date.now() / 1000);
        return Math.floor((currentTime - timeCreated) / (24 * 60 * 60)); // Days
    }

    private getGameName(gameId: string): string {
        const gameNames: { [key: string]: string } = {
            '730': 'Counter-Strike 2',
            '570': 'Dota 2',
            '440': 'Team Fortress 2'
        };
        return gameNames[gameId] || `Game ${gameId}`;
    }

    private calculateRarity(value: number): number {
        // Simplified rarity calculation
        return Math.min(Math.max(value, 1), 100);
    }

    async shutdown(): Promise<void> {
        this.logger.security('Steam API client shutdown completed');
    }
}
