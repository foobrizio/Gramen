import 'fs'
import * as fs from "fs";
import moment from "moment";
import logger from "../../../util/logger";
import pdf from "pdf-parse"


export class PdfChecker{

    docPath: string

    constructor() {
        const constants = require('../constants.json')
        this.docPath = `${constants.root}/${constants.docPath}/certificato_assicurazione.pdf`
    }

    deleteOldFile(){
        fs.unlinkSync(this.docPath)
    }

    exists():boolean {
        return fs.existsSync(this.docPath)
    }

    async isInsuranceValid(): Promise<boolean> {
        const expirationDate = await this.extractExpirationDate()
        return moment().toDate() < expirationDate
    }

    async extractExpirationDate():Promise<Date>{
        const dataBuffer = fs.readFileSync(this.docPath)
        try{
            const data = await pdf(dataBuffer)
            let rows = data.text.split('\n')
            const dateRow = rows[rows.indexOf('DayMonthYearDayMonthYear')+1]
            const dateParts = dateRow.split(' ').filter(x => x.length > 0)
            const day = parseInt(dateParts[3]);
            const month = parseInt(dateParts[4]);
            const year = parseInt(dateParts[5]);
            return new Date(year, month-1, day)
        }catch(error){
            logger.error('pdfChecker.extractExpirationDate',error)
        }
        return moment().subtract(1, 'day').toDate();
    }
}