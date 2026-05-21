import { IMessageHandler } from "../../bot/model/IMessageHandler";
import { Scenes } from "telegraf";
import { ActiveBotCommand } from "../../bot/model/ActiveBotCommand";
import { LogCommand } from "../../util/logger";
import { hoursToMillis } from "../../util/time_utils";
import { createService } from "../../bot/botManager";
import { checkWeatherAlerts } from "./functions";

export class MessageHandler implements IMessageHandler {
    readonly serviceName: string = "weather";

    descriptionMapping(): ActiveBotCommand[] {
        return [
            // {
            //     command:'start_weather',
            //     description:'Activate the weather service',
            //     permission: 'private',
            //     executedFunction: async (ctx) => await this.startWeatherCommand(ctx)
            // },
            {
                command:'start_weather_alerts',
                description:'Activate the weather alerts service',
                permission: 'private',
                executedFunction: async (ctx) => await this.startWeatherAlertsCommand(ctx)
            }
        ]
    }

    prepareScenes(): Scenes.BaseScene<Scenes.WizardContext>[] {
        // TODO: preparare le scene previste dai comandi del modulo. Leggere la documentazione o l'interfaccia IMessageHandler per maggiori dettagli.
        return [];
    }

    @LogCommand()
    async startWeatherCommand(ctx: Scenes.WizardContext) {
    }


    @LogCommand()
    async startWeatherAlertsCommand(ctx: Scenes.WizardContext) {
        let interval = hoursToMillis(3);
        let result = await createService(ctx, this.serviceName, interval, true, checkWeatherAlerts);
        if (result == true)
            await ctx.reply("Weather alerts service activated successfully");
        else
            await ctx.reply("The weather alerts service is already active or could not be activated");
    }
}
