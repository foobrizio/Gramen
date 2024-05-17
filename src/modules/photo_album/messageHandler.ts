import {IMessageHandler} from "../../bot/model/IMessageHandler";
import {Scenes} from "telegraf";
import {getPhotosFromAlbum, listOfAlbums, listOfAlbumsAsString, smartSplitting} from "./functions";
import {enableUndoForScenes, getBot, setUndoCommand, undo} from "../../bot/botManager";
import {InlineKeyboardMarkup} from "@telegraf/types";
import * as fs from "fs";
import * as https from "https"
import {ActiveBotCommand} from "../../bot/model/ActiveBotCommand";
import logger from "../../util/logger";


export class MessageHandler implements IMessageHandler{
    readonly serviceName: string = "Photo_Album";
    private readonly createAlbumSceneName:string = "photo_album.create_album"
    private readonly addPhotosSceneName:string = "photo_album.add_photos"
    private readonly getAlbumSceneName:string = "photo_album.get_album"


    descriptionMapping(): ActiveBotCommand[] {
        return [
            {
                command: "create_album",
                description: "Creates a new collection of photos",
                executedFunction: async (ctx) => {
                    logger.info(`COMMAND: create_album -> ${ctx}`)
                    await ctx.scene.enter(this.createAlbumSceneName)
                }
            },
            {
                command: "add_photos_to_album",
                description: "Adds new photos to an album",
                executedFunction: async (ctx) => {
                    logger.info(`COMMAND: add_photos_to_album -> ${ctx}`)
                    await ctx.scene.enter(this.addPhotosSceneName)
                }
            },
            {
                command: "list_album",
                description: "Lists all the collection of photo albums",
                executedFunction: async (ctx) => {
                    await this.listAlbumCommand(ctx)
                }
            },
            {
                command: "get_album",
                description: "Returns all the photos of a specific album",
                executedFunction: async (ctx) => {
                    logger.info(`COMMAND: get_album -> ${ctx}`)
                    await ctx.scene.enter(this.getAlbumSceneName)
                }
            }
        ];
    }

    //region SCENES
    prepareScenes(): Scenes.WizardScene<Scenes.WizardContext>[] {
        const createAlbumScene = this._prepareCreateAlbumScene()
        const addPhotosScene = this._prepareAddPhotosScene()
        const getAlbumScene = this._prepareGetAlbumScene()
        let result = [createAlbumScene, addPhotosScene, getAlbumScene]
        enableUndoForScenes(result)
        return result
    }

    async listAlbumCommand(ctx: Scenes.WizardContext){
        logger.info(`COMMAND: list_album -> ${ctx}`)
        const id = (ctx.chat as any).id;
        const albumListToString = listOfAlbumsAsString(id)
        if(albumListToString.length == 0){
            await ctx.reply("Non hai album")
            await undo(ctx)
            return;
        }
        else {
            await ctx.reply(albumListToString)
        }
    }

    private _prepareCreateAlbumScene(): Scenes.WizardScene<Scenes.WizardContext> {
        let album_name = "";
        let path = "";
        let completePath = "";
        let superPath = "";
        let idPath = "";
        let subFolderWasCreated: boolean = false;
        const constants = require('./constants.json')
        return new Scenes.WizardScene<Scenes.WizardContext>(
            this.createAlbumSceneName,
            async (ctx) => {
                // STEP 1
                await setUndoCommand(ctx)
                try{
                    await ctx.reply("Inserire nome del nuovo album")
                    return ctx.wizard.next()
                }catch(error: any){
                    console.error( error)
                    await ctx.reply("Si è verificato un errore durante l'esecuzione del comando")
                    return ctx.scene.leave()
                }
            },
            async(ctx) => {
                // STEP 2
                try{
                    album_name = (ctx.message as any).text
                    await ctx.reply("Inserire percorso cartella in cui inserire il nuovo album")
                    return ctx.wizard.next()
                }catch(error: any){
                    console.error( error)
                    await ctx.reply("Si è verificato un errore durante l'esecuzione del comando")
                    return ctx.scene.leave()
                }
            },
            async(ctx) => {
                // STEP 3
                try{
                    path = (ctx.message as any).text
                    const id = (ctx.chat as any).id
                    idPath = constants.photo_folder+"/"+id;
                    superPath = idPath+"/"+path;
                    completePath = superPath+"/"+album_name
                    await ctx.reply("Creazione di una nuova cartella in "+completePath+" in corso")
                    if(!fs.existsSync(completePath)){
                        if(!fs.existsSync(superPath)){
                            if(!fs.existsSync(idPath)){
                                fs.mkdirSync(idPath)
                            }
                            subFolderWasCreated = true
                            fs.mkdirSync(superPath)
                        }
                        fs.mkdirSync(completePath)
                        await ctx.reply("La cartella è stata creata. Ora inserisci almeno una foto per renderla un album")
                        return ctx.wizard.next()
                    }else{
                        await ctx.reply("La cartella esiste già")
                        return await ctx.scene.leave()
                    }
                }catch(error: any){
                    console.error( error)
                    await ctx.reply("Si è verificato un errore durante l'esecuzione del comando")
                    return ctx.scene.leave()
                }
            },
            async(ctx) => {
                //STEP 4
                try {
                    this._savePhoto(completePath, ctx);
                    //TODO: Non siamo attualmente in grado di inviare un unico messaggio per l'intero mediaGroup
                    //await ctx.reply("Salvataggio completato")
                }catch(error){
                    console.error(error)
                    await ctx.reply("Si è verificato un errore durante l'esecuzione del comando")
                    fs.rmSync(completePath, {recursive: true, force: true})
                    if(subFolderWasCreated){
                        fs.rmSync(superPath)
                    }
                }
                return ctx.scene.leave()
            }
        )
    }

    private _prepareAddPhotosScene(): Scenes.WizardScene<Scenes.WizardContext> {

        let album_name = "";
        let complete_path = "";
        return new Scenes.WizardScene<Scenes.WizardContext>(
            this.addPhotosSceneName,
            async (ctx) => {
                await setUndoCommand(ctx)
                try{
                    await this._viewAlbumChoice(ctx, "In quale album vuoi aggiungere le nuove foto?")
                    return ctx.wizard.next()
                }catch(error: any){
                    console.error(error)
                    await ctx.reply("Si è verificato un errore durante l'esecuzione del comando")
                    await ctx.scene.leave()
                }
            },
            async(ctx) => {
                try{
                    album_name = (ctx.message as any).text
                    const constants = require('./constants.json')
                    const id = (ctx.chat as any).id
                    complete_path = constants.photo_folder+"/"+id+"/"+album_name;
                    if(fs.existsSync(complete_path)){
                        await ctx.reply("Ora aggiungi le foto nell'album '"+album_name+"'");
                        return ctx.wizard.next()
                    }
                    else{
                        await ctx.reply("La cartella non esiste. Riprovare");
                        return ctx.scene.leave()
                    }

                }catch(error: any){
                    console.error( error)
                    await ctx.reply("Si è verificato un errore durante l'esecuzione del comando")
                    await ctx.scene.leave()
                }

            },
            async(ctx) => {
                try{
                    this._savePhoto(complete_path, ctx)
                    await ctx.reply("Inserimento in corso")
                    return await ctx.scene.leave()
                }catch(error: any){
                    console.error( error)
                    await ctx.reply("Si è verificato un errore durante l'esecuzione del comando")
                    await ctx.scene.leave()
                }
            }
        )
    }

    private _prepareGetAlbumScene(): Scenes.WizardScene<Scenes.WizardContext>{
        return new Scenes.WizardScene<Scenes.WizardContext>(
            this.getAlbumSceneName,
            async (ctx) => {
                await setUndoCommand(ctx)
                try{
                    await this._viewAlbumChoice(ctx, "Quale album vuoi scaricare?")
                    return ctx.wizard.next()
                }catch(error: any){
                    console.error( error)
                    await ctx.reply("Si è verificato un errore durante l'esecuzione del comando")
                    return ctx.scene.leave()
                }

            },
            async(ctx) => {
                try{
                    await ctx.editMessageReplyMarkup(undefined);
                    let album_name = (ctx.update as any).callback_query?.data;
                    await ctx.reply("Hai selezionato l'album '"+album_name+"'");
                    let photos = getPhotosFromAlbum(album_name)
                    // We cannot send more than 10 photos in a single message, so we have to split our array

                    // Questo metodo splitta l'array in chunk di 10 elementi. Bisogna cambiarlo per supportare anche il
                    // criterio secondo cui non si possono inviare più di 50MB in una sola volta.
                    // const chunk = (arr: any[], size: number): any[][] =>
                    //     Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
                    //         arr.slice(i * size, i * size + size)
                    //     );
                    // let splittedArray: InputMediaPhoto[][] = chunk(photos, 10)
                    let splitResult = smartSplitting(photos)
                    if(splitResult.ignoredPhotos > 0) {
                        if (splitResult.ignoredPhotos === 1)
                            await ctx.reply(splitResult.ignoredPhotos + " foto non può essere inviata perchè pesa più di 10MB");
                        else
                            await ctx.reply(splitResult.ignoredPhotos + " foto non possono essere inviate perchè pesano più di 10MB");
                    }
                    for(let i = 0; i< splitResult.array.length; i++){
                        let innerArray = splitResult.array[i];
                        await ctx.replyWithMediaGroup(innerArray)
                    }
                }catch(error: any){
                    console.error( error)
                    await ctx.reply('Si è verificato un errore durante l\'esecuzione del comando')
                }
                return ctx.scene.leave()
            }
        )
    }

    //endregion

    private _savePhoto(path: string, ctx: Scenes.WizardContext<Scenes.WizardSessionData>){
        let photoMessage = (ctx.update as any).message.photo
        let document = (ctx.update as any).message.document;
        let id = ""
        let name = ""
        if(photoMessage){
            // Message was sent as photo
            let photo = photoMessage.pop()
            id = photo.file_id
            name = photo.file_unique_id
        }
        else if(document){
            // Message was sent as file
            id = document.file_id
            name = document.file_name
            //const file = await ctx.telegram.getFile(photoName)

        } else{
            throw new Error("No file was found")
        }
        ctx.telegram.getFileLink(id).then((link) => {
            https.get(link, (response) =>
                response.pipe(fs.createWriteStream(`${path}/${name}.jpeg`))
            );
        });

    }

    private async _viewAlbumChoice(ctx: Scenes.WizardContext<Scenes.WizardSessionData>, message:string){
        let albums = listOfAlbums((ctx.chat as any).id)
        if( albums.length == 0){
            // Dobbiamo invocare l'undo + reloadCommand
            await ctx.reply("Non hai album");
            await undo(ctx)
            return;
        }
        let album_buttons: InlineKeyboardMarkup = {
            inline_keyboard: [[]]
        }
        //
        let row = 0;
        albums.forEach( (album,index) => {
            album_buttons.inline_keyboard[row].push({
                text: album,
                callback_data: album,
            })
            // Cambiamo riga
            if(index % 2 != 0) {
                row++;
                album_buttons.inline_keyboard.push([])
            }
        })
        await ctx.sendMessage(message, {reply_markup: album_buttons})
    }

}