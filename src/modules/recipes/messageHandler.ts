import { Scenes, Context } from "telegraf";
import { WizardContext, WizardSessionData } from "telegraf/typings/scenes";
import { ActiveBotCommand } from "../../bot/model/ActiveBotCommand";
import { IMessageHandler } from "../../bot/model/IMessageHandler";

export class MessageHandler implements IMessageHandler{

    readonly serviceName: string = "Recipes"

    //#region IMessageHandler Implementation
    descriptionMapping(): ActiveBotCommand[] {
        return [
            {
                command:'create_recipe',
                description:'Creates a new recipe',
                permission: 'private',
                executedFunction: async (ctx) => {
                    await this.createRecipe(ctx)
                }
            },
            {
                command:'get_recipe',
                description:'Retrieves an existing recipe',
                permission: 'private',
                executedFunction: async (ctx) => {
                    await this.getRecipe(ctx)
                }
            },
            {
                command:'edit_recipe',
                description:'Updates an existing recipe',
                permission: 'private',
                executedFunction: async (ctx) => {
                    await this.updateRecipe(ctx)
                }
            },
            {
                command:'delete_recipe',
                description:'Updates an existing recipe',
                permission: 'private',
                executedFunction: async (ctx) => {
                    await this.deleteRecipe(ctx)
                }
            },
        ]
    }

    prepareScenes(): Scenes.WizardScene<Scenes.WizardContext>[] {
        return [];
    }

    //#endregion


    //#region  CRUD Operations

    createRecipe(ctx: Context) {
        throw new Error("Method not implemented.");
    }
    getRecipe(ctx: Context) {
        throw new Error("Method not implemented.");
    }
    updateRecipe(ctx: Context) {
        throw new Error("Method not implemented.");
    }
    deleteRecipe(ctx: Context) {
        throw new Error("Method not implemented.");
    }

    //#endregion
    
}