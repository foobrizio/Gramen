import {Context, Telegraf} from "telegraf";
import { BotCommand } from "telegraf/types";
import {ModuleHandler} from "../modules/moduleHandler";

export function getDefaultCommands(): BotCommand[]{
    return [
        {command: "hello", description:"Sends a welcome message"} as BotCommand,
        {command: "start_test", description:"Activate the test thread. Just for didactic purpose"} as BotCommand,
        {command: "stop", description:"Stops an active thread."} as BotCommand,
    ]
}

export async function updateCommands(bot: Telegraf){
    let commandList = getDefaultCommands()
    let mh = new ModuleHandler()
    let moduleCommands = await mh.activateCommands()
    commandList = commandList.concat(moduleCommands)
    await bot.telegram.setMyCommands(commandList)
}

export function sendMessage(ctx: Context) {
    ctx.reply('Messaggio periodico ogni 4 secondi.');
}



