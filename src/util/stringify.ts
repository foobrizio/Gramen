import { Scenes } from "telegraf";

export function stringify(ctx: Scenes.WizardContext<Scenes.WizardSessionData> ): string {
    return `{chatID: ${ctx.chat?.id}, userID: ${ctx.from?.id}, username: ${ctx.from?.username}, msg: ${(ctx.update as any).message.text}}`;
}