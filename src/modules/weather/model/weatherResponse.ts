export interface WeatherResponse {
    latitude: number;
    longitude: number;
    elevation: number;
    generationtime_ms: number;
    utc_offset_seconds: number;
    timezone: string;
    timezone_abbreviation: string;
    hourly_units: {
        time: string;
        weather_code: string;
        temperature_2m: string;
        windspeed_10m: string;
        precipitation: string;
        precipitation_probability: string;
    };
    hourly: {
        time: string[];
        weather_code: number[];
        temperature_2m: number[];
        windspeed_10m: number[];
        precipitation: number[];
        precipitation_probability: number[];
    };
}