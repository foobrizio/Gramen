import {PdfChecker} from "./pdfChecker";
import {DriverStrategy} from "./strategy/driverStrategy";
import * as path from 'path';
import * as fs from "fs";
import {Context} from "telegraf";
import {UnipolApiStrategy} from "./strategy/unipolApiStrategy";

export async function checkInsurance(ctx: Context){
    if(await _checkDaScaricare()){
        await _download()
        await sendInsurance(ctx)
    }
}

async function _checkDaScaricare(){
    let pdfChecker = new PdfChecker()
    const exists = pdfChecker.exists();
    const isValid = await pdfChecker.isInsuranceValid()
    return !exists || !isValid
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

export async function sendInsurance(ctx: Context){
    let constants = require('./constants.json')
    let pdfPath = constants.root+"/"+constants.docPath+"/certificato_assicurazione.pdf"
    if(fs.existsSync(pdfPath)){
        let document = path.basename(pdfPath)
        await ctx.replyWithDocument({source: fs.createReadStream(pdfPath), filename: document}, {caption:"Ecco la tua assicurazione!"})
    }
    else{
        await ctx.reply("Il documento non è stato trovato");
    }
}