import {Browser, Builder, By, Capabilities, Key, until, WebDriver} from 'selenium-webdriver';
import {Options} from "selenium-webdriver/chrome";
import {rejects} from "node:assert";


export class DriverStrategy{

    driver: WebDriver
    chromeOptions: Options

    constructor() {

        let constants = require('../constants.json')
        this.chromeOptions = new Options();
        //this.chromeOptions.addArguments("--headless")
        this.chromeOptions.addArguments("--safebrowsing.enabled=true")
        this.chromeOptions.addArguments("--download.default_directory="+constants.root+constants.docPath)
        this.chromeOptions.addArguments("--download.prompt_for_download=true")
        this.chromeOptions.addArguments("--disable-popup-blocking");
        this.chromeOptions.addArguments("--disable-features=AutomaticDownloads");
        this.chromeOptions.addArguments("--safebrowsing-disable-auto-update");
        this.chromeOptions.addArguments("--download.directory_upgrade=true")
        this.driver = new Builder()
            .forBrowser(Browser.CHROME)
            .withCapabilities(Capabilities.chrome())
            .setChromeOptions(this.chromeOptions)
            .build();
    }

    async getInsurance(){
        return new Promise(async (resolve, reject) => {
            try{
                let constants = require('../constants.json')
                let url = constants.unipolMainUrl+"?token="+constants.token;
                await this.driver.get(url)

                let inputElements = await this.driver.findElements(By.className("tpd-inputPin"))

                for(let i = 0; i < inputElements.length; i++){
                    let elem = inputElements[i];
                    await elem.sendKeys(constants.pin.charAt(i))
                }

                // = await this.driver.findElement(By.xpath("//button[contains(@class, 'rosso')]"))
                let button = await this.driver.wait(until.elementLocated(By.xpath("//button[contains(@class, 'rosso')]")))
                setTimeout(() => {
                    button.click();
                }, 1000)
                //await button.click()
                setTimeout(() => {
                    this.close()
                    resolve(true)
                }, 10000)
            }catch(error) {
                console.log('errore:', error)
                reject(error);
            }
        })
    }

    async close(){
        await this.driver.close()
    }
}