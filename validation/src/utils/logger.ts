import winston from 'winston';

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'validation-system' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/validation-error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/validation-combined.log' 
    })
  ]
});

// Add stream for Morgan HTTP logging
logger.stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

export default logger;
