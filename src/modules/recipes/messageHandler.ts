import { Scenes, Context } from "telegraf";
import { WizardContext, WizardSessionData } from "telegraf/typings/scenes";
import { ActiveBotCommand } from "../../bot/model/ActiveBotCommand";
import { IMessageHandler } from "../../bot/model/IMessageHandler";
import logger, { LogCommand } from "../../util/logger";
import { setUndoCommand } from "../../bot/botManager";
import { message } from "telegraf/filters";
import { Ingredients } from "./model/ingredients";
import { RecipeSteps } from "./model/steps";
import { InlineKeyboardMarkup } from "@telegraf/types";

export class MessageHandler implements IMessageHandler{

    readonly serviceName: string = "Recipes"

    private readonly createRecipeSceneName:string = "recipes.create_recipe.name"
    private readonly createRecipeIngredientsSceneName: string = 'recipes.create_recipe.ingredients';
    private readonly createRecipeStepsSceneName: string = 'recipes.create_recipe.steps';
    private readonly createRecipeFinishSceneName: string = 'recipes.create_recipe.finish';

    private readonly editRecipeSceneName:string = "recipes.edit_recipe"
    private readonly getRecipeSceneName:string = "recipes.get_recipe"
    private readonly deleteRecipeSceneName:string = "recipes.delete_recipe"

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

    prepareScenes(): Scenes.BaseScene<Scenes.WizardContext>[] {
        const createRecipeScene = this._prepareCreateRecipeScene();
        //const editRecipeScene = this._prepareEditRecipeScene();
        //const getRecipeScene = this._prepareGetRecipeScene();
        //const deleteRecipeScene = this._prepareDeleteRecipeScene();
        return createRecipeScene;
    }

    //#endregion


    //#region COMMAND Operations
    @LogCommand()
    async createRecipeCommand(ctx: Scenes.WizardContext) {
        await ctx.scene.enter(this.createRecipeSceneName);
    }
    
    @LogCommand()
    async getRecipeCommand(ctx: Scenes.WizardContext) {
        await ctx.scene.enter(this.getRecipeSceneName);
    }

    @LogCommand()
    async updateRecipeCommand(ctx: Scenes.WizardContext) {
        await ctx.scene.enter(this.editRecipeSceneName);
    }
    
    @LogCommand()
    async deleteRecipeCommand(ctx: Scenes.WizardContext) {
        await ctx.scene.enter(this.deleteRecipeSceneName);
    }

    //#endregion
    
    //#region SCENE Preparations
    private _prepareCreateRecipeScene(): Scenes.BaseScene<Scenes.WizardContext>[] {
        
        let recipe_name: string = "";
        let ingredients: Ingredients[] = [];
        let steps: RecipeSteps[] = [];

        const recipeNameScene = new Scenes.BaseScene<Scenes.WizardContext>(this.createRecipeSceneName);

        // STEP 1: Get Recipe Name
        recipeNameScene.enter(async (ctx) => {
            await setUndoCommand(ctx);
            await ctx.reply("Please, provide a name for the recipe.");
        });
        recipeNameScene.on(message('text'), async (ctx) => {
            try{
                recipe_name = (ctx.message as any).text;
                await ctx.reply(`Great! The recipe will be named: ${recipe_name}.\nNow, please provide the first ingredient.`)
                return ctx.scene.enter(this.createRecipeIngredientsSceneName)
            }catch(error){
                logger.error(`createRecipeSceneName.step1 -> ${error}`)
                await ctx.reply("An error occurred while executing the command")
                return ctx.scene.leave()
            }
        });

        let createRecipeButtons: InlineKeyboardMarkup = {
            inline_keyboard: [
                [
                    { text: 'Add a new ingredient', callback_data: 'add_ingredient' },
                    { text: 'Add a new step', callback_data: 'add_step' }, 
                    { text: 'Finish', callback_data: 'finish' }
                ]
            ]
        }

        // STEP 2: Get Ingredients
        const ingredientsScene = new Scenes.BaseScene<Scenes.WizardContext>(this.createRecipeIngredientsSceneName);
        ingredientsScene.enter(async (ctx) => {
            await setUndoCommand(ctx);
            await ctx.reply("Add an ingredient in the format 'name, quantity'.");
        });

        ingredientsScene.on(message('text'), async (ctx) => {
            try{
                const input = (ctx.message as any).text; 
                let ingredientParts = input.split(',').map((i: string) => i.trim());
                ingredients.push({name: ingredientParts[0], quantity: ingredientParts[1]});
                await ctx.reply(`Ingredient added: ${ingredientParts[0]} - ${ingredientParts[1]}.\n Now you can add another ingredient, add a step or finish.`,
                    { reply_markup: createRecipeButtons }
                );
            }catch(error){
                logger.error(`createRecipeSceneName.step2 -> ${error}`)
                await ctx.reply("An error occurred while executing the command")
                return ctx.scene.leave()
            }
        });

        ingredientsScene.action('add_ingredient', async (ctx) => {
            return ctx.scene.reenter();
        });

        ingredientsScene.action('add_step', async (ctx) => {
            return ctx.scene.enter(this.createRecipeStepsSceneName);
        });

        ingredientsScene.action('finish', async (ctx) => {
            return ctx.scene.enter(this.createRecipeFinishSceneName);
        });

        // STEP 3: Get Steps
        const stepScene = new Scenes.BaseScene<Scenes.WizardContext>(this.createRecipeStepsSceneName);
        stepScene.enter(async (ctx) => {
            await setUndoCommand(ctx);
            await ctx.reply("Add a step in the format 'number: description'.");
        });

        stepScene.on(message('text'), async (ctx) => {
            try{
                const input = (ctx.message as any).text; 
                let stepParts = input.split(':').map((i: string) => i.trim());
                steps.push({number: Number(stepParts[0]), description: stepParts[1]});
                await ctx.reply(`Step added.\n Now you can add another step, add a new ingredient or finish.`,
                    { reply_markup: createRecipeButtons }
                );
            }catch(error){
                logger.error(`createRecipeSceneName.step2 -> ${error}`)
                await ctx.reply("An error occurred while executing the command")
                return ctx.scene.leave()
            }
        });

        stepScene.action('add_ingredient', async (ctx) => {
            return ctx.scene.enter(this.createRecipeIngredientsSceneName);
        });

        stepScene.action('add_step', async (ctx) => {
            return ctx.scene.reenter();
        });

        stepScene.action('finish', async (ctx) => {
            return ctx.scene.enter(this.createRecipeFinishSceneName);
        });

        const finishScene = new Scenes.BaseScene<Scenes.WizardContext>(this.createRecipeFinishSceneName);

        finishScene.enter(async (ctx) => {
            await ctx.reply(`Recipe creation finished! The recipe ${recipe_name} has been create with ${ingredients.length} ingredients and ${steps.length} steps.`);
            return ctx.scene.leave();
        });

        return [recipeNameScene, ingredientsScene, stepScene, finishScene];
    }

    private _prepareEditRecipeScene(): Scenes.BaseScene<Scenes.WizardContext> {
        return new Scenes.WizardScene<Scenes.WizardContext>(
            this.editRecipeSceneName,
        );
    }

    private _prepareGetRecipeScene(): Scenes.BaseScene<Scenes.WizardContext> {
        return new Scenes.WizardScene<Scenes.WizardContext>(
            this.getRecipeSceneName,
        );
    }

    private _prepareDeleteRecipeScene(): Scenes.BaseScene<Scenes.WizardContext> {
        return new Scenes.WizardScene<Scenes.WizardContext>(
            this.deleteRecipeSceneName,
        );
    }
    //#endregion
}
