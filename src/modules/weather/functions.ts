import { OpenMeteoStrategy } from "./strategy/OpenMeteoStrategy";
import { BotService } from "../../bot/model/BotService";

// Define strategy here
const strategy = new OpenMeteoStrategy();

export const checkWeather: BotService = async (ctx, config) => {
    let messages: string[] = await strategy.checkWeather(config);
    for(const message of messages){
        await ctx.reply(message, { parse_mode: 'Markdown'});
    }
    return true;
}

export const checkWeatherAlerts: BotService = async (ctx, config) => {
    const messages = await strategy.checkWeatherAlerts(config);
    for(const message of messages){
        await ctx.reply(message, { parse_mode: 'Markdown'});
    }
    return true;
}
