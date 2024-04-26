import {PdfChecker} from "./pdfChecker";
import {DriverStrategy} from "./strategy/driverStrategy";
import * as path from 'path';
import * as fs from "fs";
import {Context} from "telegraf";
import {UnipolApiStrategy} from "./strategy/unipolApiStrategy";

export async function checkInsurance(ctx: Context){
    if(_checkDaScaricare()){
        await _download()
        sendInsurance(ctx)
    }
}

function _checkDaScaricare(){
    let pdfChecker = new PdfChecker()
    return !pdfChecker.exists() || !pdfChecker.isInsuranceValid()
}

async function _download(){
    let pdfChecker = new PdfChecker();
    if(pdfChecker.exists())
        pdfChecker.deleteOldFile()
    // Strategy 1: It uses ChromeDriver with Selenium to navigate the page and download the file
    //let strategy = new DriverStrategy()
    // Strategy 2: It uses API calls directly
    let strategy = new UnipolApiStrategy()
    await strategy.getInsurance()
}

export function sendInsurance(ctx: Context){
    let constants = require('./constants.json')
    let pdfPath = constants.root+"/"+constants.docPath+"/certificato_assicurazione.pdf"
    if(fs.existsSync(pdfPath)){
        let document = path.basename(pdfPath)
        ctx.replyWithDocument({source: fs.createReadStream(pdfPath), filename: document}, {caption:"Ecco la tua assicurazione!"})
        //bot.telegram.sendDocument(chatId, document);
    }
    else{
        ctx.reply("Il documento non è stato trovato");
        //bot.telegram.sendMessage(chatId, "Il documento non è stato trovato");
    }
}