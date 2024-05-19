# Gramen

## Introduction
This project consists in a customizable Telegram bot which allows the developer to develop its own functionalities.
Currently, there are two already existing modules:
    1) Insurance download;
    2) Photo Album Manager.
## Modules
Modules are automatically detected by the moduleHandler and loaded at boot. Existing modules are provided with a *constants.json.example* file which has to be configured with user data and renamed to *constants.json*.
### Insurance download
TODO
### Photo Album manager
TODO
### How to create a new module:
The developer can develop its own modules and increase the number of commands the bot can execute. In order to create a new module, the following steps must be accomplished:
* Create a new subfolder inside *modules* folder.
* Create a messageHandler.ts file which contains a class named MessageHandler implementing the IMessageHandler interface.
  ```ts 
  export interface IMessageHandler{
    
    /**
     * This is the name that uniquely identifies your service. Be sure not to chose already used names
     */
    readonly serviceName: string

    /**
     * This method has to create and return an array of BotCommands, which are the commands that are exposed by the
     * service. Each ActiveBotCommand contains the following info:
     *  1) "command" -> a string which is the name of the command;
     *  2) "description" -> a longer string describing the behaviour of that command;
     *  3) "executedFunction" -> a function receiving a WizardContext as parameter and containing the logic that is
     *      executed when the command is invoked.
     */
    descriptionMapping(): ActiveBotCommand[]

    /**
     * This method must return the list of scenes, if any, that have to be used by your commands
     */
    prepareScenes(): Scenes.WizardScene<Scenes.WizardContext>[]
    }
  ```
## Components
### BotManager
TODO
### ModuleHandler
TODO
### ServiceManager
TODO
### Logger
TODO
## Services
**Services** are special operations provided by the bot that can be executed periodically. They can be started and stopped manually by the user and, after started, they perform a specific operation on a periodic cadence. 
In order to create a new service, the developer can use the built-in function *createService* inside *botManager.ts*:
```ts
/**
 * This function starts a new service for a specific user
 * @param ctx the Context received by the message
 * @param serviceName the name of the service that has to be started. It uniquely identifies the service.
 * @param interval the period (in milliseconds) between an execution and the next one
 * @param runAtStart if true, the first execution is performed immediately
 * @param executedFunction the function to be executed periodically
 */
export async function createService(ctx: Scenes.WizardContext, serviceName: string, interval: number, runAtStart: boolean, executedFunction: (ctx: Scenes.WizardContext) => Promise<void>){
    let servMgr = getServiceManager();
    let chatId = ctx.chat?.id as number;
    if(!servMgr.isSubscribed(chatId, serviceName)){
        // Possiamo far partire la nuova sottoscrizione
        await ctx.reply(`Servizio ${serviceName} attivato`)
        if(runAtStart)
            await executedFunction(ctx);
        let intervalId = setInterval( () => {
            executedFunction(ctx)
        }, interval)   //once a day
        servMgr.subscribe(chatId, {
            serviceName: serviceName,
            intervalId: intervalId
        });
    } else{
        await ctx.reply(`Hai già attivato il servizio ${serviceName}`)
    }
}
```
Services can be stopped by the user by invoking the command '*/stop*'.
## Implemented functionalities:
### v1
1. Possibility to activate/ stop threads that execute commands at specific intervals;
2. Possibility to add custom modules;
3. Built-in tools to create and handle services; 
4. Log functionality included and available for developers; 
5. Possibility to implement customized restrictions on commands; 
6. *Insurance module* for UnipolSai: the service downloads the new insurance whenever the old one is expired; 
7. *PhotoAlbum module*: you can create your own drive, add new albums and photos and download existing ones;

## TODO LIST:
* Photo album with separated folders for each user 
  * -> Weird bug on add_photos_to_album and get_album after the 2nd time