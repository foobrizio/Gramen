import {ServiceManager} from "./serviceManager";
import {Context, Scenes, session, Telegraf} from "telegraf";
import {WizardContext} from "telegraf/typings/scenes";
import {BotCommand} from "telegraf/types";
import {InlineKeyboardMarkup} from "@telegraf/types";
import {ModuleHandler} from "../modules/moduleHandler";
import config from "../util/config";

class BotManager{

    private readonly _subMgr: ServiceManager;
    private readonly _bot: Telegraf<Scenes.WizardContext>;
    private readonly listCommandsSceneName = "bot.list_commands_scene";
    private readonly stopServiceSceneName = "bot.stop_service_scene";
    private sceneList: Scenes.WizardScene<Scenes.WizardContext>[] = [];
    constructor() {
        this._bot = new Telegraf<Scenes.WizardContext>(config.bot_token);
        this._subMgr = new ServiceManager();
        this._initializeManager()
    }

    get subMgr(): ServiceManager {
        return this._subMgr;
    }

    get bot(): Telegraf<WizardContext> {
        return this._bot;
    }

    private _initializeManager(){
        this._prepareDefaultCommandScenes()
        this.bot.use(session())
    }

    getDefaultCommands(): BotCommand[]{
        return [
            {command: "hello", description:"Sends a welcome message"},
            {command: "start_test", description:"Activate the test service. Just for didactic purpose"},
            {command: "stop", description:"Stops an active service."},
            {command: "list_commands", description: "Lists every command included on a specific module"}
        ]
    }

    async loadFunctions() {
        let mh = new ModuleHandler()
        // STEP 1) Let's prepare scenes
        await this._activateScenes(mh)
        // STEP 2) let's activate commands
        await this._activateCommands(mh)
    }

    private async _activateCommands(mh: ModuleHandler){
        this._createDefaultCommands()
        let moduleCommands = await mh.activateCommands()
        let commandList = this.getDefaultCommands()
        commandList = commandList.concat(moduleCommands)
        await this.bot.telegram.setMyCommands(commandList)
    }

    private _createDefaultCommands(){
        this.bot.command("start_test",  async (ctx) => {
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
                this.sendMessage(ctx)
            }, 4000);
            //}
            //Qui aggiungiamo il thread nella mappa
            servMgr.subscribe(chatId, {
                intervalId: intervalId as NodeJS.Timeout,
                serviceName: servName
            });
        })

        this.bot.command("stop", ctx => {
            let subMgr = getServiceManager()
            let chatId: number = ctx.chat.id;
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
                    ctx.scene.enter(this.stopServiceSceneName);
                }
            }
            else{
                ctx.reply("Non c'è nessun servizio attivo")
            }
        })

        this.bot.command("hello", ctx => ctx.reply("Hi, "+ctx.message.from.first_name))

        this.bot.command("list_commands", ctx => {
            ctx.scene.enter(this.listCommandsSceneName)
        })
    }

    // region SCENES

    private async _activateScenes(mh: ModuleHandler){
        let moduleScenes = await mh.prepareCommandScenes()
        let allScenes = this.sceneList.concat(moduleScenes)
        const stage = new Scenes.Stage<Scenes.WizardContext>(allScenes)
        this.bot.use(stage.middleware())
    }


    private _prepareDefaultCommandScenes(){
        let listAlbumScene: Scenes.WizardScene<Scenes.WizardContext> = this._prepareListCommandsScene()
        let stopServiceScene: Scenes.WizardScene<Scenes.WizardContext> = this._prepareStopServiceScene()
        this.sceneList = [listAlbumScene, stopServiceScene];
    }

    private _prepareListCommandsScene(): Scenes.WizardScene<Scenes.WizardContext>{
        return new Scenes.WizardScene<Scenes.WizardContext>(
            this.listCommandsSceneName,
            async (ctx) => {
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
                    commandsDescription += "/"+botCommand.command+": "+botCommand.description+"\n"
                })
                await ctx.reply(commandsDescription)
                return await ctx.scene.leave()
            }
        );
    }

    private _prepareStopServiceScene(): Scenes.WizardScene<Scenes.WizardContext>{
        return new Scenes.WizardScene<Scenes.WizardContext>(
            this.stopServiceSceneName,
            async (ctx) => {
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
                console.log('chosenServiceName:', chosenServiceName)
                let chatId = ctx.chat?.id as number
                let serviceName = this.subMgr.getServicePair(chatId, chosenServiceName)
                await this.subMgr.unsubscribe(ctx, serviceName);
                return await ctx.scene.leave()
            }
        );
    }

    //endregion

    async sendMessage(ctx: Context) {
        await ctx.reply('Messaggio periodico ogni 4 secondi.');
    }
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


