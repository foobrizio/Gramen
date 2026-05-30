import { Context } from "telegraf";

export interface WeatherStrategy {
    checkWeather(): Promise<string[]>;
    checkWeatherAlerts(): Promise<string[]>;
}