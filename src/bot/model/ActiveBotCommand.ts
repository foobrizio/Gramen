import {BotCommand} from "telegraf/types";
import {Scenes} from "telegraf";

export interface ActiveBotCommand extends BotCommand{
    executedFunction: (ctx : Scenes.WizardContext) => void
}

export function toBotCommand(active: ActiveBotCommand): BotCommand{
    return {
        command: active.command,
        description: active.description
    }
}
