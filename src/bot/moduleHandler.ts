import {BotCommand} from "telegraf/types";
import {IMessageHandler} from "./model/IMessageHandler";
import * as fs from "fs";
import {Scenes} from "telegraf";
import {enableUndoForScenes, getBot} from "./botManager";
import {ActiveBotCommand} from "./model/ActiveBotCommand";
import logger from "../util/logger";

export class ModuleHandler{

    private readonly _modulesDir: string
    private readonly _root: string
    private readonly _discoveredModules: string[]

    constructor() {
        const config = require("../../config.json")
        this._root = config.root
        this._modulesDir = "modules"
        this._discoveredModules = this.discoverModules()
    }

    get discoveredModules(): string[] {
        return this._discoveredModules;
    }

    async getCommandsOfModule(module: string): Promise<BotCommand[]>{
        let mh = await this.getMessageHandler(module)
        return mh.descriptionMapping()
    }

    async activateCommands(): Promise<ActiveBotCommand[]>{
        let cmdList: ActiveBotCommand[] = []
        // let config = require('../../config.json')
        for (const module of this._discoveredModules) {
            //let myModule = require(potentialModulePath)
            //console.log(myModule)
            let mh = await this.getMessageHandler(module)
            let activeBotCommands =mh.descriptionMapping()
            cmdList = cmdList.concat(activeBotCommands)
            this.applyCommands(activeBotCommands)
            //mh.attachCommands(getBot())
        }
        return cmdList
    }

    applyCommands(activeBotCommands: ActiveBotCommand[]){
        activeBotCommands.forEach( command => {
            getBot().command(command.command, command.executedFunction)
        })
    }

    discoverModules(): string[]{
        const moduleDirsPath = this._root+"/"+this._modulesDir
        let dirs = fs.readdirSync(moduleDirsPath)
            .filter(file => {
                // Vogliamo soltanto le directories
                let absFile = moduleDirsPath +"/"+file
                return fs.lstatSync(absFile).isDirectory()
            }).filter(dir => {
                //Vogliamo soltanto le directories che sono effettivamente moduli
                let dirPath = moduleDirsPath+"/"+dir+"/"
                return fs.existsSync(dirPath+"messageHandler.ts")
            });
        logger.info(`Modules found : ${dirs}`)
        return dirs;
    }

    async prepareCommandScenes(): Promise<Scenes.WizardScene<Scenes.WizardContext>[]> {
        let sceneList: Scenes.WizardScene<Scenes.WizardContext>[] = []
        for (const module of this._discoveredModules){
            let mh = await this.getMessageHandler(module)
            sceneList = sceneList.concat(mh.prepareScenes())
        }
        enableUndoForScenes(sceneList)
        return sceneList;
    }

    private async getMessageHandler(module: string): Promise<IMessageHandler>{
        let path = "../"+this._modulesDir+"/"+module+"/messageHandler"
        let mod = await import(path)
        return new mod.MessageHandler() as IMessageHandler
    }
}