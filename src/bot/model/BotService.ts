import { Scenes } from "telegraf";

export type BotService = (ctx: Scenes.WizardContext, config?: any) => Promise<boolean>;