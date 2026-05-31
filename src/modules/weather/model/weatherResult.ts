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

export function weatherResultToCodeMap(results: WeatherResult[]): Map<number, WeatherResult[]> {
    const resultMap: Map<number, WeatherResult[]> = new Map();
    results.forEach(result => {
        if (!resultMap.has(result.weather_code)){
            resultMap.set(result.weather_code, []);
        }
        resultMap.get(result.weather_code)?.push(result);
    });
    results.forEach(result => {
        const orderedResult = resultMap.get(result.weather_code)?.sort((a, b) => {
            const dateA = new Date(`${a.day}T${a.hour}`);
            const dateB = new Date(`${b.day}T${b.hour}`);
            return dateA.getTime() - dateB.getTime();
        }) as WeatherResult[];
        resultMap.set(result.weather_code, orderedResult);
    });
    return resultMap;
}