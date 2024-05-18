import {ServiceManager} from "./serviceManager";
import {Context, Scenes, session, Telegraf} from "telegraf";
import {WizardContext} from "telegraf/typings/scenes";
import {InlineKeyboardMarkup} from "@telegraf/types";
import {ModuleHandler} from "./moduleHandler";
import config from "../util/config";
import {ActiveBotCommand} from "./model/ActiveBotCommand";
import logger from "../util/logger";
import {ActiveBotCommandDictionary} from "./model/ActiveBotCommandDictionary";

class BotManager{

    private readonly _subMgr: ServiceManager;
    private readonly _bot: Telegraf<Scenes.WizardContext>;
    private readonly listCommandsSceneName = "bot.list_commands_scene";
    private readonly stopServiceSceneName = "bot.stop_service_scene";
    private sceneList: Scenes.WizardScene<Scenes.WizardContext>[] = [];
    private botCommandDictionary: ActiveBotCommandDictionary = {}


    constructor() {
        this._bot = new Telegraf<Scenes.WizardContext>(config.bot_token);
        this._subMgr = new ServiceManager();
        this._initializeManager()

    }

    //region PUBLIC METHODS
    get subMgr(): ServiceManager {
        return this._subMgr;
    }

    get bot(): Telegraf<WizardContext> {
        return this._bot;
    }

    getDefaultCommands(): ActiveBotCommand[]{
        return [
            {
                command: "hello",
                description:"Sends a welcome message",
                permission: 'all',
                executedFunction: async (ctx) => await this._hello(ctx)
            },
            {
                command: "start_test",
                description:"Activate the test service. Just for didactic purpose",
                permission: 'all',
                executedFunction: async (ctx) => await this._start_test(ctx)
            },
            {
                command: "stop",
                description:"Stops an active service.",
                permission: 'all',
                executedFunction: async (ctx) => await this._stop(ctx)
            },
            {
                command: "list_commands",
                description: "Lists every command included on a specific module",
                permission: 'all',
                executedFunction: async (ctx) => {
                    logger.info(`COMMAND: list_commands -> ${ctx}`)
                    await ctx.scene.enter(this.listCommandsSceneName)
                }
            },
            {
                command: "my_services",
                description: "Lists the active services of the user",
                permission: "all",
                executedFunction: async (ctx) => await this._listServices(ctx)
            }
        ]
    }

    async loadFunctions() {
        // STEP 1) Let's prepare scenes
        await this._activateScenes()
        // STEP 2) let's activate commands
        await this._activateCommands()
    }

    async reloadCommands(ctx: Context){

        let totalList = await this.getCommandList()
        await this.bot.telegram.setMyCommands(totalList,
            {
                scope: {
                    type: "chat",
                    chat_id: ctx.chat?.id || 0
                }
            });
    }

    async getCommandList(){
        const mh = new ModuleHandler()
        const commandList = this.getDefaultCommands()
        let externalModulesDictionary = await mh.activateCommands()
        this.botCommandDictionary['core'] = commandList;
        let totalList: ActiveBotCommand[] = commandList
        for(let key in externalModulesDictionary){
            let moduleCommands = externalModulesDictionary[key]
            this.botCommandDictionary[key] = moduleCommands
            totalList = totalList.concat(moduleCommands)
        }
        return totalList;
    }

    //endregion

    //region PRIVATE METHODS
    private _initializeManager(){
        this._prepareDefaultCommandScenes()
        this.bot.use(session())
        this._prepareInterceptor()
    }

    // region INTERCEPTOR
    /**
     * L'interceptor serve per verificare che l'utente abbia i permessi per eseguire il comando richiesto.
     * Se non è un utente autorizzato, la sua richiesta viene bloccata
     * @private
     */
    private _prepareInterceptor(){
        this.bot.use(async (ctx, next) => {
            if (ctx.updateType === 'message' && (ctx.update as any).message.text) {
                const userId = ctx.from?.id
                let command = (ctx.update as any).message.text;
                if(!userId){
                    logger.warn(`Message received by a user without id. Command: ${command}, from: ${ctx.from}`)
                    await ctx.reply('Questo comando è stato bloccato dall\'interceptor.');
                    return;
                }
                // Verifica se il messaggio è un comando
                if (command.startsWith('/')) {
                    command = command.substring(1)
                    if(command !== "start" && command !== "undo"){
                        // Esegui le operazioni che desideri qui
                        const shouldProceed = this._checkUserPermissions(userId, command);
                        if (!shouldProceed) {
                            // Non chiamare next() per interrompere l'esecuzione del comando
                            await ctx.reply('Non hai i permessi per usare questo comando.');
                            return;
                        }
                    }
                }
            }
            await next();
        });
    }

    private _checkUserPermissions(userId: number, command: string): boolean {
        // STEP 1: Recuperare le permissions associate al command e il modulo di riferimento
        for(const key in this.botCommandDictionary){
            let commandFound = this.botCommandDictionary[key].filter(x => x.command === command)
            if(commandFound.length == 1){
                // L'abbiamo trovato
                return this._checkPermissionForCommand(key, commandFound[0], userId)
            }
        }
        logger.warn(`Command ${command} was not found during check of permissions for user ${userId}`)
        return false;
    }

    private _checkPermissionForCommand(moduleName: string, commandData: ActiveBotCommand, userId: number): boolean{
        if(!commandData.permission || commandData.permission === 'all'){
            // I permessi non sono dichiarati oppure il comando è pubblico
            return true;
        }
        const mh = new ModuleHandler();
        return mh.checkPermissionForModule(moduleName, commandData.permission, userId);
    }

    // endregion



    async _sendMessage(ctx: Context) {
        await ctx.reply('Messaggio periodico ogni 4 secondi.');
    }

    //endregion

    // region COMMANDS

    private async _activateCommands(){
        this._createDefaultCommands()
        const commandList = await this.getCommandList()
        await this.bot.telegram.setMyCommands(commandList)
    }

    private _createDefaultCommands(){
        this.getDefaultCommands().forEach(cmd => {
            this.bot.command(cmd.command, cmd.executedFunction)
        })
    }

    private async _start_test(ctx: Scenes.WizardContext){
        logger.info(`COMMAND: Start_test -> ${ctx}`)
        let servMgr = getServiceManager()
        let servName = 'Test'
        let chatId = ctx.chat? ctx.chat.id as number : 0;
        if(chatId === 0)
            return;
        if(servMgr.isSubscribed(chatId, servName)) {
            await ctx.reply('Il servizio è già attivo.');
            return;
        }
        // Imposta l'intervallo di 4 secondi per l'invio periodico
        await ctx.reply(servName+" attivato!")
        let intervalId = setInterval(() => {
            this._sendMessage(ctx)
        }, 4000);
        //}
        //Qui aggiungiamo il thread nella mappa
        servMgr.subscribe(chatId, {
            intervalId: intervalId as NodeJS.Timeout,
            serviceName: servName
        });
    }

    private async _stop(ctx: Scenes.WizardContext){
        logger.info(`COMMAND: Stop -> ${ctx}`)
        let subMgr = getServiceManager()
        let chatId: number = (ctx.chat as any).id;
        if(subMgr.hasRunningElements(chatId)){
            let elements = subMgr.getRunningElements(chatId)
            if(elements.length === 1){
                // C'è un solo elemento a cui possiamo disiscriverci. Facciamo automaticamente l'unsubscribe
                let servicePair = elements[0]
                setTimeout( () => {
                    subMgr.unsubscribe(ctx, servicePair);
                },1500)
            }
            else{
                // C'è più di un elemento. Dobbiamo chiedere all'utente quale servizio vuole disabilitare
                await ctx.scene.enter(this.stopServiceSceneName);
            }
        }
        else{
            await ctx.reply("Non c'è nessun servizio attivo")
        }
    }

    private async _hello(ctx: Scenes.WizardContext){
        logger.info(`COMMAND: Hello -> ${ctx}`)
        await ctx.reply("Hi, "+(ctx.message as any).from.first_name)
    }

    private async _listServices(ctx: Scenes.WizardContext){
        const userId = ctx.from?.id as number;
        const runningElements = this.subMgr.getRunningElements(userId);
        if(runningElements.length == 0){
            await ctx.reply("Non hai servizi attivi");
            return;
        }
        let serviceAnswer = "";
        runningElements.forEach((service, index) => {
            serviceAnswer += `${index+1}) ${service.serviceName}\n`
        })
        await ctx.reply(serviceAnswer)
    }
    //endregion

    // region SCENES

    private async _activateScenes(){
        let mh = new ModuleHandler()
        let moduleScenes = await mh.prepareCommandScenes()
        let allScenes = this.sceneList.concat(moduleScenes)
        const stage = new Scenes.Stage<Scenes.WizardContext>(allScenes)
        this.bot.use(stage.middleware())
    }


    private _prepareDefaultCommandScenes(){
        let listAlbumScene: Scenes.WizardScene<Scenes.WizardContext> = this._prepareListCommandsScene()
        let stopServiceScene: Scenes.WizardScene<Scenes.WizardContext> = this._prepareStopServiceScene()
        this.sceneList = [listAlbumScene, stopServiceScene];
        enableUndoForScenes(this.sceneList)
    }

    private _prepareListCommandsScene(): Scenes.WizardScene<Scenes.WizardContext>{
        return new Scenes.WizardScene<Scenes.WizardContext>(
            this.listCommandsSceneName,
            async (ctx) => {
                await setUndoCommand(ctx)
                //STEP 1: Recuperiamo i nomi dei moduli e prepariamo i bottoni
                let mh = new ModuleHandler()
                let modules = mh.discoveredModules
                let moduleKeyboard: InlineKeyboardMarkup = {
                    inline_keyboard: [[]]
                }
                //
                let row = 0;
                modules.forEach( (elem,index) => {
                    moduleKeyboard.inline_keyboard[row].push({
                        text: elem,
                        callback_data: elem,
                    })
                    // Cambiamo riga
                    if(index % 2 != 0)
                        row++;
                })
                await ctx.sendMessage("Seleziona il modulo di cui vuoi visualizzare i comandi", {reply_markup: moduleKeyboard})
                return ctx.wizard.next()
            },
            async(ctx) => {
                //STEP 2: Riceviamo la risposta ed inviamo la lista dei comandi di quel modulo

                await ctx.editMessageReplyMarkup(undefined);
                let chosenModule = (ctx.update as any).callback_query?.data;
                await ctx.reply("I comandi disponibili per il modulo "+chosenModule+" sono i seguenti")
                let mh = new ModuleHandler()
                let moduleCommands = await mh.getCommandsOfModule(chosenModule)
                let commandsDescription = "";
                moduleCommands.forEach(botCommand => {
                    //commandsDescription += "/"+botCommand.command+": "+botCommand.description+"\n"
                    commandsDescription += `/${botCommand.command}: ${botCommand.description}\n`
                })
                await ctx.reply(commandsDescription)
                await this.reloadCommands(ctx)
                return await ctx.scene.leave()
            }
        );
    }

    private _prepareStopServiceScene(): Scenes.WizardScene<Scenes.WizardContext>{
        return new Scenes.WizardScene<Scenes.WizardContext>(
            this.stopServiceSceneName,
            async (ctx) => {
                await setUndoCommand(ctx)
                //STEP 1: Chiediamo quale servizio attualmente in esecuzione vuole stoppare
                let id = ctx.chat? ctx.chat.id: 0
                let elements = this.subMgr.getRunningElements(id)
                let services: InlineKeyboardMarkup = {
                    inline_keyboard: [[]]
                }
                //
                let row = 0;
                elements.forEach( (elem,index) => {
                    services.inline_keyboard[row].push({
                        text: elem.serviceName,
                        callback_data: elem.serviceName,
                    })
                    // Cambiamo riga
                    if(index % 2 != 0)
                        row++;
                })
                await ctx.sendMessage("Quale servizio vuoi disattivare?", {reply_markup: services})
                return ctx.wizard.next()
            },
            async(ctx) => {
                //STEP 2: Riceviamo la risposta ed inviamo la lista dei comandi di quel modulo
                await ctx.editMessageReplyMarkup(undefined);
                let chosenServiceName: string = (ctx.update as any).callback_query?.data;
                let chatId = ctx.chat?.id as number
                let serviceName = this.subMgr.getServicePair(chatId, chosenServiceName)
                await this.subMgr.unsubscribe(ctx, serviceName);
                await this.reloadCommands(ctx)
                return await ctx.scene.leave()
            }
        );
    }

    //endregion
}


let botManager: BotManager;

export function startBot() {
    botManager = new BotManager()
    botManager.loadFunctions().then(async () => {
        await botManager.bot.launch()
    })
}

export function getServiceManager(): ServiceManager{
    if(botManager && botManager.subMgr)
        return botManager.subMgr
    else throw new Error("Service manager not initialized")
}

export function getBot(): Telegraf<Scenes.WizardContext>{
    if(botManager && botManager.bot)
        return botManager.bot;
    else throw new Error("Bot not initialized")
}

//region UNDO
/**
 * Use it when you create scenes. In this way, every scene can be aborted in every step he's in.
 * When a scene is enhanced, you won't be able to see the usual list of commands, but only the 'undo' command until
 * the end of the scene.
 * @param scenes the array containing the scenes you want to enhance with 'undo' command.
 */
export function enableUndoForScenes(scenes: Array<Scenes.WizardScene<Scenes.WizardContext>>){
    scenes.forEach(scene => {
        scene.command("undo", async(ctx) => {
            await undo(ctx);
        })
    })
}

export async function undo(ctx: Scenes.WizardContext<Scenes.WizardSessionData>){
    await ctx.reply("Comando annullato")
    await ctx.scene.leave()
    await botManager.reloadCommands(ctx)
}

export async function setUndoCommand(ctx: Context){
    const command = {
        command: "undo",
        description: "Aborts the current scene"
    }
    await getBot().telegram.setMyCommands([command],
        {
            scope: {
                type: "chat",
                chat_id: ctx.chat?.id || 0
            }
        })
}

//endregion

