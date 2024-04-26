import {ServiceManager} from "./serviceManager";
import {Telegraf} from "telegraf";


let subMgr: ServiceManager;
let bot: Telegraf;

export function initialize(new_bot: Telegraf) {
    bot = new_bot;
    subMgr = new ServiceManager();
}

export function getServiceManager(): ServiceManager{
    if(subMgr)
        return subMgr
    else throw new Error("Service manager not initialized")
}

export function getBot(): Telegraf{
    return bot;
}