import { Context } from "telegraf";
import { OpenMeteoStrategy } from "./strategy/OpenMeteoStrategy";

// Define strategy here
const strategy = new OpenMeteoStrategy();

export async function checkWeather(ctx: Context): Promise<boolean>{

    let messages: string[] = await strategy.checkWeather();
    for(const message of messages){
        await ctx.reply(message, { parse_mode: 'Markdown'});
    }
    return true;
}

export async function checkWeatherAlerts(ctx: Context): Promise<boolean>{

    const result= strategy.checkWeatherAlerts();
    return true;
}