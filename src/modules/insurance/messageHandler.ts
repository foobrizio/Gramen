import {Context, Scenes, Telegraf} from "telegraf";
import {checkInsurance} from "./functions";
import {IMessageHandler} from "../../bot/model/IMessageHandler";
import {BotCommand} from "telegraf/types";
import {getBot, getServiceManager} from "../../bot/botManager";
import {WizardContext} from "telegraf/typings/scenes";
import {ActiveBotCommand} from "../../bot/model/ActiveBotCommand";
import logger from "../../util/logger";

export class MessageHandler implements IMessageHandler{

    readonly serviceName: string = "Insurance"

    descriptionMapping(): ActiveBotCommand[]{
        return [
            {
                command:'start_insurance',
                description:'Activate the insurance service',
                executedFunction: async (ctx) => {
                    await this.startInsurance(ctx)
                }
            }
            ]
    }

    prepareScenes(): Scenes.WizardScene<Scenes.WizardContext>[] {
        // INFO: There are no scenes in this module
        return []
    }

    async startInsurance(ctx: Context){
        logger.info(`COMMAND: Start insurance -> ${ctx}`)
        await ctx.reply("Servizio Assicurazione attivato")
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
            await ctx.reply('Hai già attivato il servizio Assicurazione')
        }
    }
}