export interface WeatherResult {
    day: string,
    hour: string,
    weather_code: number,
    weather_description: string,
    temperature: number,
    precipitation: number,
    precipitation_probability: number
}


/**
 * Riordina i risultati meteo in un oggetto che mappa ogni giorno a una lista di WeatherResult per quel giorno.
 * @param results 
 * @returns 
 */
export function weatherResultToDailyMap(results: WeatherResult[]): Map<string, WeatherResult[]> {
    const resultMap: Map<string, WeatherResult[]> = new Map();
    results.forEach(result => {
        if (!resultMap.has(result.day)){
            resultMap.set(result.day, []);
        }
        resultMap.get(result.day)?.push(result);
    });
    return resultMap;
}