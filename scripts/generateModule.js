const fs = require('fs');
const path = require('path');

const moduleName = process.argv[2];

if (!moduleName) {
  console.error('Errore: devi specificare il nome del modulo.');
  console.error('Uso: npm run generate:module -- <moduleName>');
  process.exit(1);
}

const modulePath = path.join(__dirname, '..', 'src', 'modules', moduleName);
const confPath = path.join(__dirname, '..', 'src', 'conf', moduleName);

if (fs.existsSync(modulePath)) {
  console.error(`Errore: il modulo "${moduleName}" esiste già in src/modules.`);
  process.exit(1);
}

if (fs.existsSync(confPath)) {
  console.error(`Errore: il modulo "${moduleName}" esiste già in src/conf.`);
  process.exit(1);
}

const constantsContent = JSON.stringify({ enabled: true }, null, 4);

const messageHandlerContent = `import { ConfiguredMessageHandler } from "../../bot/model/ConfiguredMessageHandler";
import { Scenes } from "telegraf";
import { ActiveBotCommand } from "../../bot/model/ActiveBotCommand";

export class MessageHandler extends ConfiguredMessageHandler {
    readonly serviceName: string = "${moduleName}";
    private readonly config = this.getConfig()

    descriptionMapping(): ActiveBotCommand[] {
        // TODO: implementare la descrizione dei comandi del modulo. Leggere la documentazione o l'interfaccia IMessageHandler per maggiori dettagli.
        return [];
    }

    prepareScenes(): Scenes.BaseScene<Scenes.WizardContext>[] {
        // TODO: preparare le scene previste dai comandi del modulo. Leggere la documentazione o l'interfaccia IMessageHandler per maggiori dettagli.
        return [];
    }
}
`;

const configFiles = [
  { name: 'constants.json',         content: constantsContent },
  { name: 'constants.json.example', content: constantsContent },
  { name: '.gitignore',             content: 'constants.json\n' },
];

const files = [
  { name: 'functions.ts',           content: '' },
  { name: 'messageHandler.ts',      content: messageHandlerContent },
  
];

fs.mkdirSync(modulePath, { recursive: true });
fs.mkdirSync(confPath, { recursive: true });
console.log(`Cartella creata: src/modules/${moduleName}`);

for (const file of files) {
  const filePath = path.join(modulePath, file.name);
  fs.writeFileSync(filePath, file.content, 'utf8');
  console.log(`  Creato: ${file.name}`);
}

for (const configFile of configFiles){
  const configPath = path.join(confPath, configFile.name);
  fs.writeFileSync(configPath, configFile.content, 'utf8');
  console.log(`  Creato: ${configFile.name}`);
}

console.log(`\nModulo "${moduleName}" generato con successo.`);