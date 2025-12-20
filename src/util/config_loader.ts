import * as fs from "fs";
import * as path from "path";
import logger from "./logger";

const configPath = path.resolve(__dirname, '../../config.json');



interface BotConfig {
    bot_token: string;
    logs_path: string;
}

function loadConfig(): BotConfig {
    try {
        return from_file(fs.readFileSync(configPath, 'utf8'));
    } catch (err: any) {
        logger.error(`${err}`)
        return {
            bot_token: "",
            logs_path: './logs'
        };
    }
}

function from_file(data: string): BotConfig {
    return {
        bot_token: process.env.BOT_TOKEN || JSON.parse(data).bot_token,
        logs_path: process.env.LOGS_PATH || JSON.parse(data).logs_path || './logs'
    } as BotConfig;
}

const configLoader: BotConfig = loadConfig();

export default configLoader;