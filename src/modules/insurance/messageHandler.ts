import {getBot, getServiceManager} from "../../bot/shared";
import {Context} from "telegraf";
import {checkInsurance} from "./functions";
import {IMessageHandler} from "../model/IMessageHandler";
import {BotCommand} from "telegraf/types";

export class MessageHandler implements IMessageHandler{

    readonly serviceName: string = "Insurance"

    descriptionMapping(): BotCommand[]{
        return [
            {
                command:'start_insurance',
                description:'Activate the insurance service'
            }
            ]
    }

    attachCommands(){
        let bot = getBot();
        bot.command("start_insurance", ctx => {
            this.startInsurance(ctx)
            //ctx.reply("Work in progress")
        });
    }

    async startInsurance(ctx: Context){
        ctx.reply("Servizio Assicurazione attivato")
        let servMgr = getServiceManager();

        let userName = ctx.from?.first_name as string;
        let chatId = ctx.chat?.id as number;
        if(!servMgr.isSubscribed(chatId, this.serviceName)){
            // Possiamo far partire la nuova sottoscrizione
            await checkInsurance(ctx);
            let intervalId = setInterval( () => {
                checkInsurance(ctx)
            }, 3600*24*1000)   //once a day
            servMgr.subscribe(chatId, {
                serviceName: this.serviceName,
                intervalId: intervalId
            });
        } else{
            ctx.reply('Hai già attivato il servizio Assicurazione')
        }
    }
}