import { Logger } from '../utils/logger';
import axios from 'axios';

export class EnhancedSteamValidation {
    private logger: Logger;
    private developerApiKey: string;
    private steamApiKey: string;

    constructor(developerApiKey: string, steamApiKey: string) {
        this.developerApiKey = developerApiKey;
        this.steamApiKey = steamApiKey;
        this.logger = new Logger('EnhancedSteamValidation');
    }

    async initialize(): Promise<void> {
        this.logger.security('Enhanced Steam validation initialized', { 
            hasDeveloperApi: !!this.developerApiKey,
            hasSteamApi: !!this.steamApiKey
        });
    }

    async validateUserStanding(steamId: string): Promise<SteamStandingValidation> {
        try {
            this.logger.info('Validating Steam user standing', { steamId });

            // Check VAC bans
            const vacStatus = await this.checkVACBans(steamId);
            if (vacStatus.hasVACBan) {
                this.logger.security('VAC ban detected', { steamId, vacStatus });
                return {
                    isValid: false,
                    reason: 'VAC_BAN',
                    standing: SteamStanding.BLACKLISTED
                };
            }

            // Check community bans
            const communityStatus = await this.checkCommunityBans(steamId);
            if (communityStatus.hasCommunityBan) {
                this.logger.security('Community ban detected', { steamId, communityStatus });
                return {
                    isValid: false,
                    reason: 'COMMUNITY_BAN',
                    standing: SteamStanding.BLACKLISTED
                };
            }

            // Check account age and activity
            const accountStatus = await this.checkAccountStatus(steamId);
            if (accountStatus.accountAge < 30) { // Less than 30 days
                this.logger.security('New account detected', { steamId, accountStatus });
                return {
                    isValid: false,
                    reason: 'NEW_ACCOUNT',
                    standing: SteamStanding.SUSPICIOUS
                };
            }

            // Check for suspicious activity patterns
            const activityPattern = await this.analyzeActivityPattern(steamId);
            if (activityPattern.suspiciousScore > 0.7) {
                this.logger.security('Suspicious activity detected', { steamId, activityPattern });
                return {
                    isValid: false,
                    reason: 'SUSPICIOUS_ACTIVITY',
                    standing: SteamStanding.SUSPICIOUS
                };
            }

            // Check game ownership and playtime
            const gameOwnership = await this.validateGameOwnership(steamId);
            if (!gameOwnership.hasValidGames) {
                this.logger.security('No valid games owned', { steamId, gameOwnership });
                return {
                    isValid: false,
                    reason: 'NO_VALID_GAMES',
                    standing: SteamStanding.INELIGIBLE
                };
            }

            this.logger.security('Steam user standing validated successfully', { steamId });
            return {
                isValid: true,
                reason: 'VALID',
                standing: SteamStanding.CLEARED,
                accountDetails: accountStatus,
                gameDetails: gameOwnership
            };

        } catch (error) {
            this.logger.error('Steam standing validation failed', { error, steamId });
            return {
                isValid: false,
                reason: 'VALIDATION_ERROR',
                standing: SteamStanding.ERROR
            };
        }
    }

    private async checkVACBans(steamId: string): Promise<VACStatus> {
        try {
            const url = `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/`;
            const params = {
                key: this.steamApiKey,
                steamids: steamId,
                format: 'json'
            };

            const response = await axios.get(url, { params });
            
            if (response.status === 200 && response.data.players) {
                const player = response.data.players[0];
                return {
                    hasVACBan: player.VACBanned || false,
                    numberOfVACBans: player.NumberOfVACBans || 0,
                    daysSinceLastBan: player.DaysSinceLastBan || 0
                };
            }

            return { hasVACBan: false, numberOfVACBans: 0, daysSinceLastBan: 0 };

        } catch (error) {
            this.logger.error('VAC ban check failed', { error, steamId });
            return { hasVACBan: false, numberOfVACBans: 0, daysSinceLastBan: 0 };
        }
    }

    private async checkCommunityBans(steamId: string): Promise<CommunityStatus> {
        try {
            const url = `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/`;
            const params = {
                key: this.steamApiKey,
                steamids: steamId,
                format: 'json'
            };

            const response = await axios.get(url, { params });
            
            if (response.status === 200 && response.data.players) {
                const player = response.data.players[0];
                return {
                    hasCommunityBan: player.CommunityBanned || false,
                    numberOfGameBans: player.NumberOfGameBans || 0,
                    economyBan: player.EconomyBan || 'none'
                };
            }

            return { hasCommunityBan: false, numberOfGameBans: 0, economyBan: 'none' };

        } catch (error) {
            this.logger.error('Community ban check failed', { error, steamId });
            return { hasCommunityBan: false, numberOfGameBans: 0, economyBan: 'none' };
        }
    }

    private async checkAccountStatus(steamId: string): Promise<AccountStatus> {
        try {
            const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`;
            const params = {
                key: this.steamApiKey,
                steamids: steamId,
                format: 'json'
            };

            const response = await axios.get(url, { params });
            
            if (response.status === 200 && response.data.response.players) {
                const player = response.data.response.players[0];
                const accountAge = Math.floor((Date.now() - player.timecreated * 1000) / (1000 * 60 * 60 * 24));
                
                return {
                    accountAge,
                    lastLogoff: player.lastlogoff,
                    profileVisibility: player.communityvisibilitystate,
                    profileState: player.profilestate,
                    isOnline: player.personastate === 1
                };
            }

            return { accountAge: 0, lastLogoff: 0, profileVisibility: 0, profileState: 0, isOnline: false };

        } catch (error) {
            this.logger.error('Account status check failed', { error, steamId });
            return { accountAge: 0, lastLogoff: 0, profileVisibility: 0, profileState: 0, isOnline: false };
        }
    }

    private async analyzeActivityPattern(steamId: string): Promise<ActivityPattern> {
        // Implement activity pattern analysis
        // Check for bot-like behavior, rapid achievement unlocking, etc.
        return {
            suspiciousScore: 0.1, // Low suspicion
            activityLevel: 'NORMAL',
            achievementPattern: 'NATURAL'
        };
    }

    private async validateGameOwnership(steamId: string): Promise<GameOwnership> {
        try {
            const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`;
            const params = {
                key: this.steamApiKey,
                steamid: steamId,
                include_appinfo: 1,
                include_played_free_games: 1,
                format: 'json'
            };

            const response = await axios.get(url, { params });
            
            if (response.status === 200 && response.data.response) {
                const games = response.data.response.games || [];
                const validGames = games.filter((game: any) => 
                    game.playtime_forever > 60 // At least 1 hour played
                );

                return {
                    hasValidGames: validGames.length > 0,
                    totalGames: games.length,
                    validGames: validGames.length,
                    totalPlaytime: games.reduce((sum: number, game: any) => sum + game.playtime_forever, 0)
                };
            }

            return { hasValidGames: false, totalGames: 0, validGames: 0, totalPlaytime: 0 };

        } catch (error) {
            this.logger.error('Game ownership validation failed', { error, steamId });
            return { hasValidGames: false, totalGames: 0, validGames: 0, totalPlaytime: 0 };
        }
    }

    async shutdown(): Promise<void> {
        this.logger.security('Enhanced Steam validation shutdown completed');
    }
}

export enum SteamStanding {
    CLEARED = 'CLEARED',
    SUSPICIOUS = 'SUSPICIOUS',
    BLACKLISTED = 'BLACKLISTED',
    INELIGIBLE = 'INELIGIBLE',
    ERROR = 'ERROR'
}

export interface SteamStandingValidation {
    isValid: boolean;
    reason: string;
    standing: SteamStanding;
    accountDetails?: AccountStatus;
    gameDetails?: GameOwnership;
}

export interface VACStatus {
    hasVACBan: boolean;
    numberOfVACBans: number;
    daysSinceLastBan: number;
}

export interface CommunityStatus {
    hasCommunityBan: boolean;
    numberOfGameBans: number;
    economyBan: string;
}

export interface AccountStatus {
    accountAge: number;
    lastLogoff: number;
    profileVisibility: number;
    profileState: number;
    isOnline: boolean;
}

export interface ActivityPattern {
    suspiciousScore: number;
    activityLevel: string;
    achievementPattern: string;
}

export interface GameOwnership {
    hasValidGames: boolean;
    totalGames: number;
    validGames: number;
    totalPlaytime: number;
}
