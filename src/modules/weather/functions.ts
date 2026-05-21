import { Context } from "telegraf";
import axios from "axios";
import { WeatherResult } from "./model/weatherResult";
import { WeatherCode } from "./model/weatherCode";

let constants = require('./constants.json')

export async function checkWeatherAlerts(ctx: Context): Promise<boolean>{
    const latitude = constants.coords.lat;
    const longitude = constants.coords.lon;
    const timezone = constants.timezone;
    const baseUrl = "https://api.open-meteo.com/v1/forecast";

    const response = await axios.get(baseUrl, {
        params: {
            latitude: latitude,
            longitude: longitude,
            timezone: timezone,
            hourly: "weather_code",
            forecast_days: 3
        }
    });

    const times: string[] = response.data.hourly.time;
    const codes: number[] = response.data.hourly.weather_code;
    const now = new Date();
    let results: WeatherResult[] = [];
    times.forEach((time, index) => {
        const forecastTime = new Date(time);
        if (forecastTime > now) {
            results.push({ time: time, weather_code: codes[index] });
        }
    });

    console.log("Weather API response:", results);

    results = results.filter(result => result.weather_code in severeWeatherList);
    console.log("Severe weather alerts:", results)
    return false;
}

function severeWeatherList(): number[] {
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