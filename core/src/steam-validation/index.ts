import { Logger } from '../utils/logger';
import { SecurityManager } from '../security-manager';
import { SteamConfig, Achievement } from '../index';
import axios from 'axios';

export class SteamValidation {
    private logger: Logger;
    private securityManager: SecurityManager;
    private config: SteamConfig;

    constructor(config: SteamConfig, securityManager: SecurityManager) {
        this.config = config;
        this.securityManager = securityManager;
        this.logger = new Logger('SteamValidation');
    }

    async initialize(): Promise<void> {
        this.logger.security('Steam validation initialized', { 
            openidRealm: this.config.openidRealm 
        });
    }

    async validateSteamId(steamId: string): Promise<boolean> {
        try {
            this.logger.info('Validating Steam ID', { steamId });

            // Basic format validation
            if (!this.isValidSteamIdFormat(steamId)) {
                this.logger.security('Invalid Steam ID format', { steamId });
                return false;
            }

            // Steam API validation (if API key is available)
            if (this.config.apiKey) {
                const isValid = await this.validateWithSteamAPI(steamId);
                if (!isValid) {
                    this.logger.security('Steam API validation failed', { steamId });
                    return false;
                }
            }

            this.logger.security('Steam ID validation successful', { steamId });
            return true;

        } catch (error) {
            this.logger.error('Steam ID validation failed', { error, steamId });
            return false;
        }
    }

    async getAchievements(steamId: string): Promise<Achievement[]> {
        try {
            this.logger.info('Getting Steam achievements', { steamId });

            if (!this.config.apiKey) {
                this.logger.warn('No Steam API key available, returning mock data');
                return this.getMockAchievements(steamId);
            }

            const url = `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/`;
            const params = {
                appid: '730', // Counter-Strike 2
                key: this.config.apiKey,
                steamid: steamId,
                format: 'json'
            };

            const response = await axios.get(url, { params });
            
            if (response.status !== 200 || !response.data.playerstats) {
                this.logger.warn('No achievements found or API error', { steamId });
                return [];
            }

            const stats = response.data.playerstats.stats || [];
            const achievements: Achievement[] = stats.map((stat: any) => ({
                id: stat.name,
                name: stat.name,
                value: stat.value,
                steamId,
                timestamp: Date.now()
            }));

            this.logger.info('Retrieved achievements', { 
                steamId, 
                count: achievements.length 
            });

            return achievements;

        } catch (error) {
            this.logger.error('Failed to get Steam achievements', { error, steamId });
            return [];
        }
    }

    async validateAchievement(achievement: Achievement): Promise<boolean> {
        try {
            this.logger.info('Validating achievement', { 
                achievementId: achievement.id, 
                steamId: achievement.steamId 
            });

            // Validate achievement format
            if (!this.isValidAchievement(achievement)) {
                this.logger.security('Invalid achievement format', { achievement });
                return false;
            }

            // Validate timestamp
            const currentTime = Date.now();
            const ageThreshold = this.config.sessionTimeout * 1000;
            
            if (currentTime - achievement.timestamp > ageThreshold) {
                this.logger.security('Achievement too old', { 
                    achievementId: achievement.id, 
                    age: currentTime - achievement.timestamp 
                });
                return false;
            }

            // Validate Steam ID ownership
            const steamValid = await this.validateSteamId(achievement.steamId);
            if (!steamValid) {
                this.logger.security('Invalid Steam ID for achievement', { 
                    achievementId: achievement.id, 
                    steamId: achievement.steamId 
                });
                return false;
            }

            this.logger.security('Achievement validation successful', { 
                achievementId: achievement.id 
            });
            return true;

        } catch (error) {
            this.logger.error('Achievement validation failed', { error, achievement });
            return false;
        }
    }

    private isValidSteamIdFormat(steamId: string): boolean {
        return /^[0-9]{17}$/.test(steamId);
    }

    private async validateWithSteamAPI(steamId: string): Promise<boolean> {
        try {
            const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`;
            const params = {
                key: this.config.apiKey,
                steamids: steamId,
                format: 'json'
            };

            const response = await axios.get(url, { params });
            
            if (response.status !== 200) {
                return false;
            }

            const data = response.data;
            return data.response && data.response.players && data.response.players.length > 0;

        } catch (error) {
            this.logger.error('Steam API validation failed', { error, steamId });
            return false;
        }
    }

    private isValidAchievement(achievement: Achievement): boolean {
        return !!(achievement.id && 
                 achievement.name && 
                 achievement.steamId && 
                 achievement.value >= 0 && 
                 achievement.timestamp > 0);
    }

    private getMockAchievements(steamId: string): Achievement[] {
        return [
            {
                id: 'first_blood',
                name: 'First Blood',
                value: 1,
                steamId,
                timestamp: Date.now()
            },
            {
                id: 'veteran',
                name: 'Veteran',
                value: 1,
                steamId,
                timestamp: Date.now()
            }
        ];
    }

    async shutdown(): Promise<void> {
        this.logger.security('Steam validation shutdown completed');
    }
}
