import { Logger } from '../utils/logger';

export class SessionManager {
    private logger: Logger;
    private sessionTimeout: number;
    private activeSessions: Map<string, { created: number; lastAccess: number }>;

    constructor(sessionTimeout: number) {
        this.sessionTimeout = sessionTimeout;
        this.activeSessions = new Map();
        this.logger = new Logger('SessionManager');
    }

    async initialize(): Promise<void> {
        this.logger.security('Session manager initialized', { sessionTimeout: this.sessionTimeout });
    }

    createSession(steamId: string): void {
        const now = Date.now();
        this.activeSessions.set(steamId, {
            created: now,
            lastAccess: now
        });
        
        this.logger.security('Session created', { steamId });
    }

    validateSession(steamId: string): boolean {
        const session = this.activeSessions.get(steamId);
        if (!session) {
            this.logger.security('No session found', { steamId });
            return false;
        }

        const now = Date.now();
        const timeSinceLastAccess = now - session.lastAccess;
        
        if (timeSinceLastAccess > this.sessionTimeout * 1000) {
            this.activeSessions.delete(steamId);
            this.logger.security('Session expired', { steamId, timeSinceLastAccess });
            return false;
        }

        // Update last access time
        session.lastAccess = now;
        this.activeSessions.set(steamId, session);
        
        return true;
    }

    invalidateSession(steamId: string): void {
        this.activeSessions.delete(steamId);
        this.logger.security('Session invalidated', { steamId });
    }

    cleanupExpiredSessions(): void {
        const now = Date.now();
        const expiredSessions: string[] = [];

        for (const [steamId, session] of this.activeSessions.entries()) {
            const timeSinceLastAccess = now - session.lastAccess;
            if (timeSinceLastAccess > this.sessionTimeout * 1000) {
                expiredSessions.push(steamId);
            }
        }

        expiredSessions.forEach(steamId => {
            this.activeSessions.delete(steamId);
        });

        if (expiredSessions.length > 0) {
            this.logger.security('Expired sessions cleaned up', { 
                count: expiredSessions.length 
            });
        }
    }

    async shutdown(): Promise<void> {
        this.activeSessions.clear();
        this.logger.security('Session manager shutdown completed');
    }
}
