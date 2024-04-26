import 'fs'
import * as fs from "fs";
import moment from "moment";


export class PdfChecker{

    docPath: string

    constructor() {
        const constants = require('./constants.json')
        this.docPath = constants.docPath
    }

    deleteOldFile(){
        fs.unlinkSync(this.docPath)
    }

    exists():boolean {
        return fs.existsSync(this.docPath)
    }

    isInsuranceValid():boolean {
        //TODO: Implementare questa funzione
        return false;
    }

    extractExpirationDate(text: string):Date{
        //TODO: Implementare questa funzione
        let yesterday = moment().subtract(1, 'day').toDate();
        return yesterday;
    }
}