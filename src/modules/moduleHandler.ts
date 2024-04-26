import * as fs from "fs";
import {BotCommand} from "telegraf/types";

export class ModuleHandler{

    modulesDir: string
    root: string
    discoveredModules: string[]

    constructor() {

        const config = require("../../config.json")
        this.root = config.root
        this.modulesDir = "modules"
        this.discoveredModules = []
    }

    private _discoverModules(): string[]{
        const moduleDirsPath = this.root+"/"+this.modulesDir
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

    async activateCommands(): Promise<BotCommand[]>{
        this.discoveredModules = this._discoverModules()
        let cmdList: BotCommand[] = []
        // let config = require('../../config.json')
        for (const module of this.discoveredModules) {
            //TODO trovare l'alternativa a importlib.import_module("modules." + mod_dir + ".MessageHandler")
            // Qui si usa descriptionMapping
            let potentialModulePath = "./"+module+"/messageHandler"
            //let myModule = require(potentialModulePath)
            //console.log(myModule)
            let mod = await import(potentialModulePath)
            let mh = new mod.MessageHandler()
            cmdList = cmdList.concat(mh.descriptionMapping())
            await this._loadCommandModules(potentialModulePath, cmdList)
        }
        return cmdList
    }

    async _loadCommandModules(modulePath:string, commands: BotCommand[]){
        let mod = await import(modulePath)
        let mh = new mod.MessageHandler()
        // Qui si usa attachCommands
        mh.attachCommands(commands)
    }
}