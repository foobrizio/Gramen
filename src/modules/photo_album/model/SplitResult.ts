import {InputMediaPhoto} from "telegraf/types";

export interface SplitResult{
    ignoredPhotos: number,
    array: InputMediaPhoto[][]
}