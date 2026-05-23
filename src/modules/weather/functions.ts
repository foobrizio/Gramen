import { Context } from "telegraf";
import axios from "axios";
import { WeatherResult, weatherResultToDailyMap } from "./model/weatherResult";
import { enumToString, WeatherCode, weatherCodeToIcon } from "./model/weatherCode";
import { WeatherResponse } from "./model/weatherResponse";
import { dayOfWeek, monthToString } from "../../util/time_utils";

let constants = require('./constants.json')
const baseUrl = "https://api.open-meteo.com/v1/forecast";

const fasce = [
    { label: "🌙 Notte",      hours: [0, 1, 2, 3, 4, 5] },
    { label: "☕ Mattina",    hours: [6, 7, 8, 9, 10, 11] },
    { label: "🌄 Pomeriggio", hours: [12, 13, 14, 15, 16, 17] },
    { label: "🌆 Sera",       hours: [18, 19, 20, 21, 22, 23] },
];

export async function checkWeather(ctx: Context): Promise<boolean>{

    const weatherResults = (await getWeatherResultsFromOpenMeteoApi());
    const dailyMap: Map<string, WeatherResult[]> = weatherResultToDailyMap(weatherResults);
    for (const [day, result] of dailyMap.entries()) {
        let dayName = dayOfWeek(day);
        let dayNumber = day.split('-')[2];
        let monthName = monthToString(day.split('-')[1]);
        let messageLines: string[] = [`Meteo per ${dayName} ${dayNumber} ${monthName}: \n`];

        fasce.forEach(fascia => {
            const righe = result
                .filter(r => fascia.hours.includes(parseInt(r.hour)))
                .map(r => `  - ${r.hour} ${weatherCodeToIcon(r.weather_code)} ${r.temperature}°C`);
            if (righe.length > 0) {
                messageLines.push(`\n${fascia.label}`);
                messageLines.push(...righe);
            }
        });
        await ctx.reply(messageLines.join('\n'), { parse_mode: 'Markdown'});
    };
    return true;
}

export async function checkWeatherAlerts(ctx: Context): Promise<boolean>{

    const weatherResults = (await getWeatherResultsFromOpenMeteoApi())
        .filter(result => severeWeatherList().includes(result.weather_code));

    const dailyMap: Map<string, WeatherResult[]> = weatherResultToDailyMap(weatherResults);

    
    
    // if (results.length > 0) {
    //     const alert = `Allerta meteo! Condizioni climatiche avverse previste nelle prossime ore:\n\n`
    //         + results.map(r => `${new Date(r.time).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}: ${r.weather_description}`)
    //             .join('\n');
    //     await ctx.reply(alert);
    // }
    return true;
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


async function getWeatherResultsFromOpenMeteoApi(): Promise<WeatherResult[]> {
    const latitude = constants.coords.lat;
    const longitude = constants.coords.lon;
    const timezone = constants.timezone;

    const now = new Date();

    const response = await axios.get(baseUrl, {
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

// function buildAIPrompt(data: WeatherResponse) {
//     const days: Record<string, DayData> = {};
//     const latitude = constants.coords.lat;
//     const longitude = constants.coords.lon;

//     data.hourly.time.forEach((t, i) => {
//          const date = t.split('T')[0];
//          if (!days[date]) 
//              days[date] = { codes: [], temps: [], winds: [], precip: [] };
//          days[date].codes.push(data.hourly.weather_code[i]);
//          days[date].temps.push(data.hourly.temperature_2m[i]);
//          days[date].winds.push(data.hourly.windspeed_10m[i]);
//          days[date].precip.push(data.hourly.precipitation[i]);
//      });

//     let desc = '';
//     for (const [date, d] of Object.entries(days)) {
//         const dominant = getDominantCondition(d.codes);
//         const tempMin = Math.round(Math.min(...d.temps));
//         const tempMax = Math.round(Math.max(...d.temps));
//         const windMax = Math.round(Math.max(...d.winds));
//         const precipTotal = d.precip.reduce((a, b) => a + b, 0).toFixed(1);

//         desc += `- ${date}: ${dominant}, temperatura ${tempMin}–${tempMax}°C, `
//             + `vento max ${windMax} km/h, precipitazioni ${precipTotal} mm\n`;
//     }

//     return `Sei un meteorologo. Analizza questi dati per località con coordinate lat:${latitude}, lon:${longitude} e scrivi un riassunto 
//         in italiano chiaro (3-5 frasi) per un utente finale. Descrivi l'andamento giorno per giorno, evidenzia cambiamenti significativi 
//         e condizioni particolari come pioggia forte o neve. Alla fine dai un giudizio complessivo. Dati:
//         ${desc}`;
// }

// function getDominantCondition(codes: number[]): string {
//   const counts: Record<number, number> = {};
//   for (const code of codes) {
//     counts[code] = (counts[code] || 0) + 1;
//   }

//   const dominantCode = Number(
//     Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
//   );

//   return enumToString(dominantCode as WeatherCode);
// }