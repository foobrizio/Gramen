import {BotCommand} from "telegraf/types";
import {IMessageHandler} from "../bot/model/IMessageHandler";
import * as fs from "fs";
import {Scenes} from "telegraf";

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
        let potentialModulePath = "./"+module+"/messageHandler"
        let mod = await import(potentialModulePath)
        let mh: IMessageHandler = new mod.MessageHandler()
        return mh.descriptionMapping()
    }



    async activateCommands(): Promise<BotCommand[]>{
        let cmdList: BotCommand[] = []
        // let config = require('../../config.json')
        for (const module of this._discoveredModules) {
            let potentialModulePath = "./"+module+"/messageHandler"
            //let myModule = require(potentialModulePath)
            //console.log(myModule)
            let mod = await import(potentialModulePath)
            let mh = new mod.MessageHandler()
            cmdList = cmdList.concat(mh.descriptionMapping())
            mh.attachCommands(cmdList)
        }
        return cmdList
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
        console.log('Modules found:', dirs)
        return dirs;
    }

    async prepareCommandScenes(): Promise<Scenes.WizardScene<Scenes.WizardContext>[]> {
        let sceneList: Scenes.WizardScene<Scenes.WizardContext>[] = []
        for (const module of this._discoveredModules){
            let potentialModulePath = "./"+module+"/messageHandler"
            let mod = await import(potentialModulePath)
            let mh: IMessageHandler = new mod.MessageHandler()
            sceneList = sceneList.concat(mh.prepareScenes())
        }
        return sceneList;
    }
}