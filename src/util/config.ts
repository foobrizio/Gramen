import * as fs from "fs";
import * as path from "path";
import logger from "./logger";

const configPath = path.resolve(__dirname, '../../config.json');



interface BotConfig {
    bot_token: string;
}

function readConfig(): BotConfig {
    try {
        const data: string = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data) as BotConfig;
    } catch (err: any) {
        logger.error(`${err}`)
        return {
            bot_token: ""
        };
    }
}

const config: BotConfig = readConfig();

export default config;