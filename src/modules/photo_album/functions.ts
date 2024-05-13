import * as fs from "fs";
import {InputMediaPhoto} from "telegraf/types";
import {SplitResult} from "./model/SplitResult";


// region listAlbum
export function listOfAlbums(id: string): string[]{
    let constants = require('./constants.json')
    let basePath = constants.photo_folder+"/"+id;
    if(!fs.existsSync(basePath))
        return [];
    return _findLeaves(basePath, [])
}

export function listOfAlbumsAsString(id: string): string{
    let album_list = listOfAlbums(id)
    if(album_list.length == 0)
        return "";
    let finalString = "";
    album_list.forEach((album, index) => {
        finalString = finalString.concat((index+1)+") "+album+";\n")
    })
    return finalString;
}

//endregion

//region getAlbum
export function getPhotosFromAlbum(album_name:string): string[]{
    const constants = require('./constants.json')
    const basePath = constants.photo_folder;
    const albumPath = basePath+"/"+album_name
    return fs.readdirSync(albumPath)
        .filter(elem => _isPhoto(albumPath+"/"+elem))
        .map(photo => albumPath+"/"+photo)
}

function _convertPhotosToInputMediaPhoto(photos: string[]): InputMediaPhoto[]{
    return photos.map(photo => {
        return {
            type: 'photo',
            //media: 'attach://'+itemPath
            media: {source: fs.createReadStream(photo)}
        }
    })
}

/**
 * Questo metodo si occupa di splittare un array di stringhe in un array di array di InputMediaPhoto.
 * L'array viene splittato in chunk con le seguenti caratteristiche:
 * 1) Il numero massimo di foto presenti in un chunk è 10
 * 2) La dimensione massima complessiva del chunk è di 50MB
 * 3) I file più grandi di 10MB vengono ignorati, perchè Telegram non li supporta
 * @param array
 */
export function smartSplitting(array: string[]): SplitResult{
    const MAX_PHOTOS_FOR_CHUNK = 10;
    let arrayCollector: InputMediaPhoto[][] = []
    let chunk: string[] = [];
    let chunkDimension = 0; // Contiamo gli elementi che stiamo inserendo nell'array
    let ignoredPhotos:number = 0;
    const pushChunk = () => {
        let convertedChunk = _convertPhotosToInputMediaPhoto(chunk)
        arrayCollector.push(convertedChunk)
        chunkDimension = 0;
        chunk = []
    }

    for(let i = 0; i <array.length; i++){
        let stats = fs.lstatSync(array[i])
        let dimensionMB:number = parseFloat((stats.size/1024/1024).toFixed(2));
        let tooBig = false;
        // STEP 1) Verify if the photo is too large
        if(dimensionMB >= 10){
            tooBig = true;
            ignoredPhotos++;
            //throw new Error("One photo is too large to be handled. Its size overcomes 10MB")
            console.log("Una foto è stata ignorata. La sua dimensione supera 10MB")
        }
        // STEP 2) Verify if the chunk has reached the maximum dimension
        if(dimensionMB + chunkDimension >= 50){
            pushChunk()
        }
        // STEP 3) Verify if the chunk has reached maximum size:
        else if(chunk.length +1 === MAX_PHOTOS_FOR_CHUNK){
            // Siamo arrivati al limite massimo del chunk. Va inserito dentro il collector e creato un nuovo chunk
            pushChunk();
        }
        //STEP 4) We can add the photo to the chunk
        if(!tooBig){
            chunk.push(array[i])
            chunkDimension += dimensionMB
        }
    }
    //STEP 5) If there is a pending chunk, we add it to the array collector.
    if(chunk.length > 0)
        pushChunk()
    return {
        ignoredPhotos: ignoredPhotos,
        array: arrayCollector
    };
}
//endregion

//region common stuff

function _findLeaves(path: string, leaves: string[]): string[]{
    const items = fs.readdirSync(path, { withFileTypes: true });
    items.forEach(item => {
        let innerPath = item.path+"\\"+item.name;
        if(_containsDirectories(innerPath)){
            // Siamo in una cartella che contiene sottocartelle. Prima di andare in profondità, verifichiamo
            // se anche questa cartella contiene delle foto, oltre che a sottocartelle
            if(_containsPhotos(innerPath)){
                _pushLeaf(innerPath, leaves)
            }
            // Dobbiamo entrare ancora più in profondità. Serve un metodo ricorsivo
            leaves.concat(_findLeaves(innerPath, leaves))
        }
        else if (fs.lstatSync(innerPath).isDirectory()){
            _pushLeaf(innerPath, leaves)

        }
    })
    return leaves;
}

function _pushLeaf(path: string, leaves: string[]){
    let constants = require('./constants.json')
    let basePath = constants.photo_folder;
    let cleanedPath = path.split(basePath+"\\")[1]
    leaves.push(cleanedPath)
}

function _containsDirectories(path: string): boolean {
    const stats = fs.lstatSync(path);
    if(stats.isDirectory()){
        const subItems = fs.readdirSync(path);
        return subItems.some(item => {
            let subItemPath =`${path}\\${item}`
            return fs.lstatSync(subItemPath).isDirectory()
        })
    }
    return false;
}

function _isPhoto(file: string): boolean {
    const imageExtensions = ["jpg", "jpeg", "png"]
    let itemStats = fs.lstatSync(file);
    if(itemStats.isFile()){
        let lastPart = file.split('\\').pop()
        let extension = lastPart?.split('.').pop()?.toLowerCase()
        if(extension){
            return imageExtensions.includes(extension)
        }
    }
    return false;
}


function _containsPhotos(path: string): boolean {

    if(fs.lstatSync(path).isDirectory()) {
        const subItems = fs.readdirSync(path);
        return subItems.some(item => {
            return _isPhoto(path+"/"+item)
        })
    }
    return false;
}

//endregion
