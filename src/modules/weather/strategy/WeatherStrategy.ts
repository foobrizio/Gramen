import { Context } from "telegraf";

export interface WeatherStrategy {
    checkWeather(config: any): Promise<string[]>;
    checkWeatherAlerts(config: any): Promise<string[]>;
}