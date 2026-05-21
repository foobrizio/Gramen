import { Context, Scenes } from "telegraf";
import { createService } from "../../bot/botManager";
import { ActiveBotCommand } from "../../bot/model/ActiveBotCommand";
import { IMessageHandler } from "../../bot/model/IMessageHandler";
import logger, { LogCommand } from "../../util/logger";
import { checkInsurance, sendInsurance } from "./functions";
import { hoursToMillis } from "../../util/time_utils";

export class MessageHandler implements IMessageHandler{

    readonly serviceName: string = "Insurance"

    descriptionMapping(): ActiveBotCommand[]{
        return [
            {
                command:'start_insurance',
                description:'Activate the insurance service',
                permission: 'private',
                executedFunction: async (ctx) => await this.startInsuranceCommand(ctx)
            },
            {
                command:'get_insurance',
                description:'Return the pdf with the current insurance',
                permission: 'private',
                executedFunction: async (ctx) => await this.sendInsuranceCommand(ctx)
            }
        ]
    }

    prepareScenes(): Scenes.BaseScene<Scenes.WizardContext>[] {
        // INFO: There are no scenes in this module
        return []
    }

    @LogCommand()
    async sendInsuranceCommand(ctx: Context){
        const userId = ctx.from?.id as number;
        await sendInsurance(ctx)
    }

    @LogCommand()
    async startInsuranceCommand(ctx: Scenes.WizardContext){
        const interval = hoursToMillis(24);
        let result =await createService(ctx, this.serviceName, interval, true, checkInsurance);
        if (result == true)
            await ctx.reply("Insurance service activated successfully");
        else
            await ctx.reply("The insurance service is already active or could not be activated");
    }
}