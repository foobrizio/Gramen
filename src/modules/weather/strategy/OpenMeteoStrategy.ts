import { Context } from "telegraf";
import axios from "axios";
import { WeatherResult, weatherResultToDailyMap } from "../model/weatherResult";
import { WeatherStrategy } from "./WeatherStrategy";
import { enumToString, WeatherCode, weatherCodeToIcon } from "../model/weatherCode";
import { WeatherResponse } from "../model/weatherResponse";
import { dayOfWeek, monthToString } from "../../../util/time_utils";



export class OpenMeteoStrategy implements WeatherStrategy {

    constants = require('../constants.json')
    baseUrl = "https://api.open-meteo.com/v1/forecast";

    fasce = [
        { label: "🌙 Notte",      hours: [0, 1, 2, 3, 4, 5] },
        { label: "☕ Mattina",    hours: [6, 7, 8, 9, 10, 11] },
        { label: "🌄 Pomeriggio", hours: [12, 13, 14, 15, 16, 17] },
        { label: "🌆 Sera",       hours: [18, 19, 20, 21, 22, 23] },
    ];


    async checkWeather(): Promise<string[]> {
        const weatherResults = (await this.getWeatherResultsFromOpenMeteoApi());
        const dailyMap: Map<string, WeatherResult[]> = weatherResultToDailyMap(weatherResults);
        let messages: string[] = [];
        for (const [day, result] of dailyMap.entries()) {
            let dayName = dayOfWeek(day);
            let dayNumber = day.split('-')[2];
            let monthName = monthToString(day.split('-')[1]);
            let messageLines: string[] = [`Meteo per ${dayName} ${dayNumber} ${monthName}: \n`];
    
            this.fasce.forEach(fascia => {
                const righe = result
                    .filter(r => fascia.hours.includes(parseInt(r.hour)))
                    .map(r => `  - ${r.hour} ${weatherCodeToIcon(r.weather_code)} ${r.temperature}°C`);
                if (righe.length > 0) {
                    messageLines.push(`\n${fascia.label}`);
                    messageLines.push(...righe);
                }
            });
            messages.push(messageLines.join('\n'));
        };
        return messages;
    }

    async checkWeatherAlerts(): Promise<string[]> {
        const weatherResults = (await this.getWeatherResultsFromOpenMeteoApi())
            .filter(result => OpenMeteoStrategy.severeWeatherList().includes(result.weather_code));

        const dailyMap: Map<string, WeatherResult[]> = weatherResultToDailyMap(weatherResults);
        return [];
    }


    private static severeWeatherList(): number[] {
        return [
            WeatherCode.FREEZING_DRIZZLE_DENSE,
            WeatherCode.RAIN_HEAVY,
            WeatherCode.FREEZING_RAIN_HEAVY,
            WeatherCode.SNOW_HEAVY,
            WeatherCode.SNOW_GRAINS,
            WeatherCode.RAIN_SHOWERS_VIOLENT,
            WeatherCode.SNOW_SHOWERS_HEAVY,
            WeatherCode.THUNDERSTORM,
            WeatherCode.THUNDERSTORM_SLIGHT_HAIL,
            WeatherCode.THUNDERSTORM_HEAVY_HAIL
        ]
    }


    private async getWeatherResultsFromOpenMeteoApi(): Promise<WeatherResult[]> {
        const latitude = this.constants.coords.lat;
        const longitude = this.constants.coords.lon;
        const timezone = this.constants.timezone;

        const now = new Date();

        const response = await axios.get(this.baseUrl, {
            params: {
                latitude: latitude,
                longitude: longitude,
                timezone: timezone,
                hourly: ["weather_code", "temperature_2m", "windspeed_10m", "precipitation", "precipitation_probability"],
                forecast_days: 3
            }
        });
        let weatherData: WeatherResponse = response.data as WeatherResponse;

        const times: string[] = weatherData.hourly.time;
        const codes: number[] = weatherData.hourly.weather_code;
        let results: WeatherResult[] = [];
        times.forEach((time, index) => {
            const forecastTime = new Date(time);
            if (forecastTime > now) {
                const day = time.split('T')[0];
                const hour = time.split('T')[1];
                results.push({ 
                    day: day,
                    hour: hour,
                    weather_code: codes[index],
                    weather_description: enumToString(codes[index] as WeatherCode),
                    temperature: weatherData.hourly.temperature_2m[index],
                    precipitation: weatherData.hourly.precipitation[index],
                    precipitation_probability: weatherData.hourly.precipitation_probability[index]
                });
            }
        });
        
        return results.filter(result => {
            let today = now.toISOString().split('T')[0];
            let rightNow = now.toISOString().split('T')[1];
            return result.day > today || (result.day === today && result.hour > rightNow);
        });
    }
}