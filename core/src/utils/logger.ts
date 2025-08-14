import winston from 'winston';

export class Logger {
    private logger: winston.Logger;

    constructor(service: string) {
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service },
            transports: [
                new winston.transports.File({ 
                    filename: 'logs/error.log', 
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                }),
                new winston.transports.File({ 
                    filename: 'logs/combined.log',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                })
            ]
        });

        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.simple()
            }));
        }
    }

    info(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(message, meta);
    }

    warn(message: string, meta?: Record<string, unknown>): void {
        this.logger.warn(message, meta);
    }

    error(message: string, meta?: Record<string, unknown>): void {
        this.logger.error(message, meta);
    }

    debug(message: string, meta?: Record<string, unknown>): void {
        this.logger.debug(message, meta);
    }

    security(message: string, meta?: Record<string, unknown>): void {
        this.logger.info(`SECURITY: ${message}`, { ...meta, security: true });
    }
}
