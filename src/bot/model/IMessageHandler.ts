import {BotCommand} from "telegraf/types";
import {Scenes, Telegraf} from "telegraf";
import {ActiveBotCommand} from "./ActiveBotCommand";

export interface IMessageHandler{

    /**
     * This is the name that uniquely identifies your service. Be sure not to chose already used names
     */
    readonly serviceName: string

    /**
     * This method has to create and return an array of BotCommands, which are the commands that are exposed by the
     * service. Each ActiveBotCommand contains the following info:
     *  1) "command" -> a string which is the name of the command;
     *  2) "description" -> a longer string describing the behaviour of that command;
     *  3) "executedFunction" -> a function receiving a WizardContext as parameter and containing the logic that is
     *      executed when the command is invoked.
     */
    descriptionMapping(): ActiveBotCommand[]

    /**
     * This method must return the list of scenes, if any, that have to be used by your commands
     */
    prepareScenes(): Scenes.WizardScene<Scenes.WizardContext>[]
}