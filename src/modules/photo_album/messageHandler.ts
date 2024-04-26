import {IMessageHandler} from "../model/IMessageHandler";
import {BotCommand} from "telegraf/types";
import {getBot} from "../../bot/shared";

export class MessageHandler implements IMessageHandler{
    readonly serviceName: string = "Photo_Album"

    attachCommands(): void {
        let bot = getBot();
        bot.command("create_album", ctx => {
            ctx.reply("Work in progress")
        })
        bot.command("add_photos_to_album", ctx => {
            ctx.reply("Work in progress")
        })
        bot.command("list_album", ctx => {
            ctx.reply("Work in progress")
        })
        bot.command("get_album", ctx => {
            ctx.reply("Work in progress")
        })
    }

    descriptionMapping(): BotCommand[] {
        return [
            {
                command: "create_album",
                description: "Creates a new collection of photos"
            },
            {
                command: "add_photos_to_album",
                description: "Adds new photos to an album"
            },
            {
                command: "list_album",
                description: "Lists all the collection of photo albums"
            },
            {
                command: "get_album",
                description: "Returns all the photos of a specific album"
            }
        ];
    }

}