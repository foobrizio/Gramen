import {BotCommand} from "telegraf/types";
import {Scenes} from "telegraf";

export interface IMessageHandler{
    readonly serviceName: string
    descriptionMapping(): BotCommand[],
    attachCommands(): void
    prepareScenes(): Scenes.WizardScene<Scenes.WizardContext>[]
}