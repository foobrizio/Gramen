import { Telegraf } from "telegraf";
import config from './util/config'
import {sendMessage, updateCommands} from "./bot/botFunctions";
import {getServiceManager, initialize} from "./bot/shared";
import {InlineKeyboardMarkup} from "@telegraf/types";


const bot = new Telegraf(config.bot_token);

initialize(bot)


bot.command("start_test", ctx => {
    let servMgr = getServiceManager()
    let servName = 'Test'
    let chatId = ctx.chat? ctx.chat.id as number : 0;
    if(chatId === 0)
        return;
    if(servMgr.isSubscribed(chatId, servName)) {
        ctx.reply('Il servizio è già attivo.');
        return;
    }
    //let intervalId = subMgr.threadMap.get(chatId)?.filter(s => s.subscriptionName === subscriptionName)[0]?.intervalId;
    //console.log('intervalId', intervalId)
    //if (intervalId) {
    //    ctx.reply( 'Il servizio è già attivo.');
    //    return;
    //} else {
        // Imposta l'intervallo di 4 secondi per l'invio periodico
        ctx.reply(servName+" attivato!")
        let intervalId = setInterval(() => {
            sendMessage(ctx)
        }, 4000);
    //}
    //Qui aggiungiamo il thread nella mappa
    servMgr.subscribe(chatId, {
        intervalId: intervalId as NodeJS.Timeout,
        serviceName: servName
    });
})

bot.command("stop", ctx => {
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
                bot.action(elem.serviceName, (ctx) => {
                    subMgr.unsubscribe(ctx, elem);
                    ctx.editMessageReplyMarkup(undefined);
                })
            })
            ctx.sendMessage("Quale servizio vuoi disattivare?", {reply_markup: services})
        }
    }
})

bot.command("hello", ctx => ctx.reply("Hi"))


updateCommands(bot)

bot.launch();
