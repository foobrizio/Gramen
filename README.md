# ModularTelegramBot.ts

## Introduction
This project consists in a customizable Telegram bot which allows the developer to develop its own functionalities.
Currently there are two already existing modules:
    1) Insurance download;
    2) Photo Album Manager.

## Modules

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
     * service. Each BotCommand consists in a "command" string that is the name of the command and a "description", which
     * is a longer string describing the behaviour of that command.
     */
    descriptionMapping(): BotCommand[]

    /**
     * In this method the commands of the module must be applied to the bot received as parameter. An example of
     * applying a command to the bot is the following:
     * bot.command("myCommand", (ctx) => {
     *     // TODO: Write the logic of your command here
     * }
     */
    attachCommands(bot: Telegraf<Scenes.WizardContext<Scenes.WizardSessionData>>): void

    /**
     * This method must return the list of scenes, if any, that have to be used by your commands
     */
    prepareScenes(): Scenes.WizardScene<Scenes.WizardContext>[]
    }
  ```
## Implemented functionalities:
1. Possibility to activate/ stop threads that execute commands at specific intervals;
2. Possibility to add custom modules;
3. Insurance module for UnipolSai: the service downloads the new insurance whenever the old one is expired;
4. PhotoAlbum module: you can create your own drive, add new albums and photos and download existing ones;

## TODO LIST:
* Limited access to users for specific commands or modules
* Logs