import { Scenes } from "telegraf";
import { ActiveBotCommand } from "./ActiveBotCommand";
import { IMessageHandler } from "./IMessageHandler";

export abstract class ConfiguredMessageHandler implements IMessageHandler{

    abstract readonly serviceName: string;
    
    getConfig(): any{
        return require(`../../conf/${this.serviceName}/constants.json`);
    }

    abstract descriptionMapping(): ActiveBotCommand[];

    abstract prepareScenes(): Scenes.BaseScene<Scenes.WizardContext>[] 
}