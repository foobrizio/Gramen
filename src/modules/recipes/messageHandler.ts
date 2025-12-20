import { Scenes, Context } from "telegraf";
import { WizardContext, WizardSessionData } from "telegraf/typings/scenes";
import { ActiveBotCommand } from "../../bot/model/ActiveBotCommand";
import { IMessageHandler } from "../../bot/model/IMessageHandler";
import { LogCommand } from "../../util/logger";

export class MessageHandler implements IMessageHandler{

    readonly serviceName: string = "Recipes"

    //#region IMessageHandler Implementation
    descriptionMapping(): ActiveBotCommand[] {
        return [
            {
                command:'create_recipe',
                description:'Creates a new recipe',
                permission: 'private',
                executedFunction: async (ctx) => await this.createRecipeCommand(ctx)
            },
            {
                command:'get_recipe',
                description:'Retrieves an existing recipe',
                permission: 'private',
                executedFunction: async (ctx) => await this.getRecipeCommand(ctx)
            },
            {
                command:'edit_recipe',
                description:'Updates an existing recipe',
                permission: 'private',
                executedFunction: async (ctx) => await this.updateRecipeCommand(ctx)
            },
            {
                command:'delete_recipe',
                description:'Updates an existing recipe',
                permission: 'private',
                executedFunction: async (ctx) => await this.deleteRecipeCommand(ctx)
            },
        ]
    }

    prepareScenes(): Scenes.WizardScene<Scenes.WizardContext>[] {
        return [];
    }

    //#endregion


    //#region  CRUD Operations

    @LogCommand()
    createRecipeCommand(ctx: Context) {
        throw new Error("Method not implemented.");
    }
    
    @LogCommand()
    getRecipeCommand(ctx: Context) {
        throw new Error("Method not implemented.");
    }

    @LogCommand()
    updateRecipeCommand(ctx: Context) {
        throw new Error("Method not implemented.");
    }
    
    @LogCommand()
    deleteRecipeCommand(ctx: Context) {
        throw new Error("Method not implemented.");
    }

    //#endregion
    
}