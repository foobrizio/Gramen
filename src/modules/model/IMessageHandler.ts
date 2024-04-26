import {BotCommand} from "telegraf/types";

export interface IMessageHandler{
    readonly serviceName: string
    descriptionMapping(): BotCommand[],
    attachCommands(): void
}