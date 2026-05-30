import {BotCommand} from "telegraf/types";
import {IMessageHandler} from "./model/IMessageHandler";
import * as fs from "fs";
import {Scenes} from "telegraf";
import {enableUndoForScenes, getBot} from "./botManager";
import {ActiveBotCommand} from "./model/ActiveBotCommand";
import logger from "../util/logger";
import {ActiveBotCommandDictionary} from "./model/ActiveBotCommandDictionary";


export class ModuleHandler{

    private readonly _modulesDir: string = "modules"
    private readonly _confDir: string = "conf"
    private readonly _root: string = './src'
    private readonly _discoveredModules: string[]

    private configs = new Map<string, any>();

    constructor() {
        this._discoveredModules = this.discoverModules()
    }

    get discoveredModules(): string[] {
        return this._discoveredModules;
    }

    getConfig(moduleName: string){
        if(this.configs.has(moduleName)){
            this.configs.set(
                moduleName,
                require(`../conf/${moduleName}/constants.json`)
            );
        }
        return this.configs.get(moduleName);
    }

    async getCommandsOfModule(module: string): Promise<BotCommand[]>{
        let mh = await this.getMessageHandler(module)
        return mh.descriptionMapping()
    }

    async activateCommands(): Promise<ActiveBotCommandDictionary>{
        let cmdDictionary: ActiveBotCommandDictionary = {}
        // let config = require('../../config.json')
        for (const module of this._discoveredModules) {
            //let myModule = require(potentialModulePath)
            //console.log(myModule)
            let mh = await this.getMessageHandler(module)
            let activeBotCommands =mh.descriptionMapping()
            //cmdList = cmdList.concat(activeBotCommands)
            cmdDictionary[module] = activeBotCommands
            this.applyCommands(activeBotCommands)
            //mh.attachCommands(getBot())
        }
        return cmdDictionary
    }

    applyCommands(activeBotCommands: ActiveBotCommand[]){
        activeBotCommands.forEach( command => {
            getBot().command(command.command, command.executedFunction)
        })
    }

    discoverModules(): string[]{
        const moduleDirsPath = `${this._root}/${this._modulesDir}`
        const moduleConfPath = `${this._root}/${this._confDir}`
        let dirs = fs.readdirSync(moduleDirsPath)
            .filter(file => {
                // Vogliamo soltanto le directories
                let absFile = `${moduleDirsPath}/${file}`
                return fs.lstatSync(absFile).isDirectory()
            }).filter(dir => {
                //Vogliamo soltanto le directories che sono effettivamente moduli
                let dirPath = `${moduleDirsPath}/${dir}/`
                return fs.existsSync(dirPath+"messageHandler.ts")
            }).filter(module => {
                //Vogliamo soltanto i moduli che sono attivi
                let moduleConstants = `${moduleConfPath}/${module}/constants.json`;
                if(fs.existsSync(moduleConstants)){
                    const raw = fs.readFileSync(moduleConstants, 'utf-8');
                    const data = JSON.parse(raw);
                    return data.enabled;
                }
                return false;
            });
        if(dirs.length > 0){
            logger.info(`Modules found : ${dirs}`)
        } else {
            logger.info('No modules found. Ensure that the modules are located in the correct directory and that they are enabled.');
        }
        return dirs;
    }

    async prepareCommandScenes(): Promise<Scenes.BaseScene<Scenes.WizardContext>[]> {
        let sceneList: Scenes.BaseScene<Scenes.WizardContext>[] = []
        for (const module of this._discoveredModules){
            let mh = await this.getMessageHandler(module)
            sceneList = sceneList.concat(mh.prepareScenes())
        }
        enableUndoForScenes(sceneList)
        return sceneList;
    }

    private async getMessageHandler(module: string): Promise<IMessageHandler>{
        let path = `../${this._modulesDir}/${module}/messageHandler`
        let mod = await import(path)
        return new mod.MessageHandler() as IMessageHandler
    }

    async checkPermissionForModule(module: string, group: string, userId: number): Promise<boolean>{
        //let modulePath = `../${this._modulesDir}/${module}/constants.json`;
        const mh = await this.getMessageHandler(module);
        const moduleConstants = mh.getConfig();
        const permissionDictionary = moduleConstants.permissions;
        if(!permissionDictionary){
            return true; //If no permissions are defined, everyone can access
        }
        const groupList: number[] = permissionDictionary[group]
        return groupList? groupList.includes(userId) : false;
    }
}