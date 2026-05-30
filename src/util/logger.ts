import { createLogger, format, transports, Logger } from 'winston';
import fs from 'fs';
import path from 'path';
import { stringify } from './stringify';
const config = require("../../config.json")

const logsDir = config?.logs_path || './logs/';

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

let logger: Logger;

// Funzione per estrarre classe e metodo dallo stack
function getCallerInfo(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';
    
    const stackLines = stack.split('\n');
    // stackLines[0] = "Error"
    // stackLines[1] = "at getCallerInfo"
    // stackLines[2] = "at info/error/warn/debug wrapper"
    // stackLines[3] = "at actual caller" <- questo ci interessa
    
    const callerLine = stackLines[3];
    if (!callerLine) return 'unknown';
    
    // Estrae il nome dal formato "at ClassName.methodName" o "at methodName"
    const match = callerLine.match(/at\s+(?:(\w+)\.)?(\w+)\s+\(/);
    if (match) {
        const className = match[1];
        const methodName = match[2];
        return className ? `${className}.${methodName}` : methodName;
    }
    
    return 'unknown';
}


export function initLogger(logsDir: string): void {
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    logger = createLogger({
        level: config.log_level || 'info',
        format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.errors({ stack: true }),
            format.splat(),
            format.printf(({ timestamp, level, caller, message }) => {
                return `${timestamp} | ${level} | ${caller || 'unknown'} | ${message}`; 
            })
        ),
        defaultMeta: { service: 'telegram-bot' },
        transports: [
            new transports.File({ 
                filename: path.join(logsDir, 'error.log'), 
                level: 'error' 
            }),
            new transports.File({ 
                filename: path.join(logsDir, 'bot.log') 
            })
        ]
    });

    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(),
            format.simple()
        )
    }));
}

function getLogger(): Logger {
    if (!logger) {
        throw new Error('Logger not initialized! Call initLogger() first.');
    }
    return logger;
}

export function LogCommand() {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;
        const className = target.constructor.name;
        const methodName = propertyKey;
        
        // Converti createAlbumCommand -> create_album
        const commandName = methodName
            .replace(/Command$/, '')
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase();

        descriptor.value = async function (...args: any[]) {
            const ctx = args[0];
            logger.info(`COMMAND: ${commandName} -> ${stringify(ctx)}`, {
                caller: `${className}.${methodName}`
            });

            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

export default {
    info: (message: string, ...meta: any[]) => {
        const caller = getCallerInfo();
        getLogger().info(message, { caller, ...meta });
    },
    error: (message: string, ...meta: any[]) => {
        const caller = getCallerInfo();
        getLogger().error(message, { caller, ...meta });
    },
    warn: (message: string, ...meta: any[]) => {
        const caller = getCallerInfo();
        getLogger().warn(message, { caller, ...meta });
    },
    debug: (message: string, ...meta: any[]) => {
        const caller = getCallerInfo();
        getLogger().debug(message, { caller, ...meta });
    }
};