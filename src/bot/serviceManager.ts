import * as path from 'path';
import {ServicePair} from "./model/servicePair";
import {Context} from "telegraf";

export class ServiceManager {

    threadMap: Map<number, ServicePair[]> = new Map<number, ServicePair[]>()

    subscribe(chatId: number, ServicePair: ServicePair){
        let userThreadList = this.threadMap.get(chatId)? this.threadMap.get(chatId) as ServicePair[] : [];
        userThreadList.push(ServicePair);
        this.threadMap.set(chatId, userThreadList);
    }

    _forgetSubscription(chatId: number, ServicePair: ServicePair){
        let userThreadList = this.threadMap.get(chatId)? this.threadMap.get(chatId) as ServicePair[] : [];
        this.threadMap.set(chatId, userThreadList.filter(s => s.intervalId !== ServicePair.intervalId));
    }

    isSubscribed(chatId: number, serviceName: string):boolean{
        if(this.hasRunningElements(chatId)){
            let userThreadList = this.threadMap.get(chatId) as ServicePair[];
            return userThreadList.filter(s => s.serviceName === serviceName).length > 0
        }
        return false;
    }

    hasRunningElements(chatId: number): boolean{
        let userThreadList = this.threadMap.get(chatId);
        //console.log('userThreadList:', userThreadList)
        return userThreadList? userThreadList?.length > 0 : false;
    }

    getRunningElements(chatId: number): ServicePair[]{
        return this.hasRunningElements(chatId) ? this.threadMap.get(chatId) as ServicePair[] : []
    }

    getServicePair(chatId: number, serviceName: string){
        let array: ServicePair[] = this.threadMap.get(chatId)? this.threadMap.get(chatId) as ServicePair[] : [];
        if(array.length === 0)
            throw new Error("Il servizio non è stato trovato");
        let elem= array.find( service => service.serviceName === serviceName)
        if (elem === undefined)
            throw new Error("Il servizio non è stato trovato");
        return elem;
    }

    async unsubscribe(ctx: Context, servicePair: ServicePair){
        await ctx.reply("Annullamento della sottoscrizione "+servicePair.serviceName+" in corso...")
        let intervalId = servicePair.intervalId;
        clearInterval(intervalId);
        let chatId = ctx.chat? ctx.chat.id as number : 0;
        if(chatId === 0)
            return;
        // Qui eliminiamo il thread dalla mappa
        this._forgetSubscription(chatId, servicePair)
        await ctx.reply("Operazione completata. Da ora non riceverai più aggiornamenti su "+servicePair.serviceName);
    }
}