import { Context, Scenes } from "telegraf";
import { createService } from "../../bot/botManager";
import { ActiveBotCommand } from "../../bot/model/ActiveBotCommand";
import { IMessageHandler } from "../../bot/model/IMessageHandler";
import logger from "../../util/logger";
import { checkInsurance, sendInsurance } from "./functions";

export class MessageHandler implements IMessageHandler{

    readonly serviceName: string = "Insurance"

    descriptionMapping(): ActiveBotCommand[]{
        return [
            {
                command:'start_insurance',
                description:'Activate the insurance service',
                permission: 'private',
                executedFunction: async (ctx) => {
                    await this.startInsurance(ctx)
                }
            },
            {
                command:'get_insurance',
                description:'Return the pdf with the current insurance',
                permission: 'private',
                executedFunction: async (ctx) => {
                    await this.sendInsurance(ctx)
                }
            }
        ]
    }

    prepareScenes(): Scenes.WizardScene<Scenes.WizardContext>[] {
        // INFO: There are no scenes in this module
        return []
    }

    async sendInsurance(ctx: Context){
        const userId = ctx.from?.id as number;
        logger.info(`COMMAND: get_insurance -> userId: ${userId}`)
        await sendInsurance(ctx)
    }

    async startInsurance(ctx: Scenes.WizardContext){
        let userName = ctx.from?.first_name as string;
        let userId = ctx.from?.id as number;
        let chatId = ctx.chat?.id as number;
        logger.info(`COMMAND: Start insurance -> userId:${userId}`)
        let result =await createService(ctx, this.serviceName, 3600*24*1000, true, checkInsurance);
        if (result == true)
            await ctx.reply("Servizio Assicurazione attivato")
        else
            await ctx.reply("Il servizio Assicurazione è già attivo oppure non è stato possibile attivarlo");

    }
}