import { Scenes } from "telegraf";
import { ActiveBotCommand } from "../../bot/model/ActiveBotCommand";
import { LogCommand } from "../../util/logger";
import { daysToMillis, hoursToMillis } from "../../util/time_utils";
import { createService } from "../../bot/botManager";
import { checkWeather, checkWeatherAlerts } from "./functions";
import { ConfiguredMessageHandler } from "../../bot/model/ConfiguredMessageHandler";

export class MessageHandler extends ConfiguredMessageHandler {

    readonly serviceName: string = "weather";
    private readonly config = this.getConfig();

    descriptionMapping(): ActiveBotCommand[] {
        return [
            {
                command:'start_weather',
                description:'Activate the weather service',
                permission: 'private',
                executedFunction: async (ctx) => await this.startWeatherCommand(ctx)
            },
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
        let interval = daysToMillis(1);
        let result = await createService(ctx, this.serviceName, interval, true, checkWeather, this.config);
    }


    @LogCommand()
    async startWeatherAlertsCommand(ctx: Scenes.WizardContext) {
        let interval = hoursToMillis(3);
        let result = await createService(ctx, this.serviceName+"_alerts", interval, true, checkWeatherAlerts, this.config);
    }
}
