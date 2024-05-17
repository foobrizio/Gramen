import * as fs from "fs";
import logger from "../../../util/logger";

export class UnipolApiStrategy{

    constants = require('../constants.json')

    async getInsurance():Promise<string> {
        const axios = require('axios')
        const token = this.constants.token
        let url = this.constants.unipolPdfUrl;
        let body = {
            "pin": this.constants.pin,
            "token": token
        }

        //console.log('body:', body)
        const options = {
            method: 'POST',
            url: url,
            headers: {
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'it-IT,it;q=0.7',
                'Connection': 'keep-alive',
                'Content-Length': '212',
                'Content-Type': 'application/json',
                'Cookie': '_cls_v=abdf209e-de72-42a3-9793-f9e926eba0ff; s_fid=621A812F0C9BAE56-32323B77207AEBFE; s_vi=[CS]v1|33134DBF4C328DB0-60000BA38329869C[CE]; mdLogger=false; dtCookie=v_4_srv_4_sn_BBFCF29FA6E57B45C6D0E74E027B901A_perc_100000_ol_0_mul_1_app-3A41ccdc4dfa79c8ff_1; TS01ab60da=01de53d37ed979659ff7607c66c9566a3330868918ecd26013dafe019cbdafc66fc31b83f064e05b0adc39c8296668fd4bab04b1fa; TS015a2447=01de53d37ec97629528a352251870b2816d0c71f64ecd26013dafe019cbdafc66fc31b83f0f2888c78d8657444e942f7343ccb96aba1c9637295db94d45338ab7ae5fc59e9; rxVisitor=1714059593875GUU737TFPF1LM0G66NC889562KVRNC2I; dtSa=-; _cls_s=483fa0e1-924a-46e8-bd2a-652324155b39:1; s_cc=true; ext_page_name_prev=area_pubblica:certificato-assicurazione:certificato-assicurazione; utag_main=v_id:018f06cf5c8c000d11808fcbf8990406f002106700a1d$_sn:3$_ss:0$_st:1714061594091$vapi_domain:unipolsai.it$ses_id:1714059594491%3Bexp-session$_pn:2%3Bexp-session; kampyleUserSession=1714059794666; kampyleUserSessionsCount=10; kampyleSessionPageCounter=1; TS3861d806027=0859b2a892ab2000be09abcea07eaecfa80c6d25cbad286b4efa0e71794f69c461ab8403fab23adf08a53d7daf113000f0284d157f7d8d79fb3ec7eb89210c60875786e03c60e9c322fb5bcd2cdb7be0028471c73ae4ee46f9489ef1e40a9405; s_sq=unipolsai.it.web.prod%3D%2526c.%2526a.%2526activitymap.%2526page%253Darea_pubblica%25253Acertificato-assicurazione%25253Acertificato-assicurazione%2526link%253DProsegui%2526region%253DtpdCertificatoAssicurazioneWidget_0%2526pageIDType%253D1%2526.activitymap%2526.a%2526.c%2526pid%253Darea_pubblica%25253Acertificato-assicurazione%25253Acertificato-assicurazione%2526pidt%253D1%2526oid%253DProsegui%2526oidt%253D3%2526ot%253DSUBMIT; rxvt=1714061703929|1714059593881; dtPC=4$459791582_581h31vGGVIRKFCRWALKQRALDCFICIFCSPIPTFH-0e0',
                'DNT': '1',
                'Host': 'www.unipolsai.it',
                'Origin': 'https://www.unipolsai.it',
                'Referer': 'https://www.unipolsai.it/certificato-assicurazione?token='+this.constants.token,
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-GPC': '1',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Chromium";v="124", "Brave";v="124", "Not-A.Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': "Windows",
                'x-dtpc': '4$459791582_581h31vGGVIRKFCRWALKQRALDCFICIFCSPIPTFH-0e0',
                'x-ibm-client-id': this.constants["ibm-client-id"],
                'x-ibm-client-secret': this.constants["ibm-client-secret"],
                'x-unipol-canale': 'AR',
                'x-unipol-requestid': '2171405990392043',
            }
        }

        let result = await axios.post(url,body, options);
        let base64Document = result.data.document
        return await this.savePdfFile(base64Document)
    }

    async savePdfFile(base64Document: string):Promise<string>{
        return new Promise( async (resolve, reject) => {
            try{
                const buff = Buffer.from(base64Document, 'base64');
                let outputPath = this.constants.root+"/"+this.constants.docPath+"/certificato_assicurazione.pdf"
                fs.writeFile(outputPath, buff, (err) => {
                    if (err) {
                        logger.error('unipolApiStrategy.savePdfFile', err);
                        reject(err);
                    } else {
                        resolve(outputPath);
                    }
                });
            }catch(error){
                logger.error(`unipolApiStrategy.savePdfFile error: ${error}`)
                reject(error);
            }
        })

    }

}