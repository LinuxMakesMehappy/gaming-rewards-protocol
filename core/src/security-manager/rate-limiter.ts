import { Logger } from '../utils/logger';

export class RateLimiter {
    private logger: Logger;
    private requestsPerMinute: number;
    private burstSize: number;
    private requestCounts: Map<string, { count: number; resetTime: number }>;

    constructor(requestsPerMinute: number, burstSize: number) {
        this.requestsPerMinute = requestsPerMinute;
        this.burstSize = burstSize;
        this.requestCounts = new Map();
        this.logger = new Logger('RateLimiter');
    }

    async initialize(): Promise<void> {
        this.logger.security('Rate limiter initialized', { 
            requestsPerMinute: this.requestsPerMinute, 
            burstSize: this.burstSize 
        });
    }

    checkLimit(identifier: string): boolean {
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute window
        const current = this.requestCounts.get(identifier);

        if (!current || now > current.resetTime) {
            // Reset or initialize counter
            this.requestCounts.set(identifier, {
                count: 1,
                resetTime: now + windowMs
            });
            return true;
        }

        if (current.count >= this.requestsPerMinute) {
            this.logger.security('Rate limit exceeded', { identifier, count: current.count });
            return false;
        }

        // Increment counter
        current.count++;
        this.requestCounts.set(identifier, current);
        return true;
    }

    async shutdown(): Promise<void> {
        this.requestCounts.clear();
        this.logger.security('Rate limiter shutdown completed');
    }
}
