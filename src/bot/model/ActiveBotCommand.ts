import {BotCommand} from "telegraf/types";
import {Scenes} from "telegraf";

export interface ActiveBotCommand extends BotCommand{
    /**
     * If validated, it refers to the group of users that have access to the command.
     * Groups must be declared in constants.json file, inside 'permissions' attribute, and they must contain
     * an array with IDs of enabled users.
     */
    permission?: string,

    /**
     * This is the function that will be executed when the command is invoked.
     * @param ctx
     */
    executedFunction: (ctx : Scenes.WizardContext) => void
}

export function toBotCommand(active: ActiveBotCommand): BotCommand{
    return {
        command: active.command,
        description: active.description
    }
}
