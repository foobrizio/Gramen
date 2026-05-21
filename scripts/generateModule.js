const fs = require('fs');
const path = require('path');

const moduleName = process.argv[2];

if (!moduleName) {
  console.error('Errore: devi specificare il nome del modulo.');
  console.error('Uso: npm run generate:module -- <moduleName>');
  process.exit(1);
}

const modulePath = path.join(__dirname, '..', 'src', 'modules', moduleName);

if (fs.existsSync(modulePath)) {
  console.error(`Errore: il modulo "${moduleName}" esiste già in src/modules.`);
  process.exit(1);
}

const constantsContent = JSON.stringify({ enabled: true }, null, 4);

const messageHandlerContent = `import { IMessageHandler } from "../../bot/model/IMessageHandler";
import { Scenes } from "telegraf";
import { ActiveBotCommand } from "../../bot/model/ActiveBotCommand";

export class MessageHandler implements IMessageHandler {
    readonly serviceName: string = "${moduleName}";

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

const files = [
  { name: 'constants.json',         content: constantsContent },
  { name: 'constants.json.example', content: constantsContent },
  { name: 'functions.ts',           content: '' },
  { name: 'messageHandler.ts',      content: messageHandlerContent },
  { name: '.gitignore',             content: 'constants.json\n' },
];

fs.mkdirSync(modulePath, { recursive: true });
console.log(`Cartella creata: src/modules/${moduleName}`);

for (const file of files) {
  const filePath = path.join(modulePath, file.name);
  fs.writeFileSync(filePath, file.content, 'utf8');
  console.log(`  Creato: ${file.name}`);
}

console.log(`\nModulo "${moduleName}" generato con successo.`);