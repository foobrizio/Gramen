import {BotCommand} from "telegraf/types";
import {Scenes, Telegraf} from "telegraf";

export interface IMessageHandler{

    /**
     * This is the name that uniquely identifies your service. Be sure not to chose already used names
     */
    readonly serviceName: string

    /**
     * This method has to create and return an array of BotCommands, which are the commands that are exposed by the
     * service. Each BotCommand consists in a "command" string that is the name of the command and a "description", which
     * is a longer string describing the behaviour of that command.
     */
    descriptionMapping(): BotCommand[]

    /**
     * In this method the commands of the module must be applied to the bot received as parameter. An example of
     * applying a command to the bot is the following:
     * bot.command("myCommand", (ctx) => {
     *     // TODO: Write the logic of your command here
     * }
     */
    attachCommands(bot: Telegraf<Scenes.WizardContext<Scenes.WizardSessionData>>): void

    /**
     * This method must return the list of scenes, if any, that have to be used by your commands
     */
    prepareScenes(): Scenes.WizardScene<Scenes.WizardContext>[]
}