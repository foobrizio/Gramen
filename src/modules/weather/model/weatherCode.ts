export enum WeatherCode {
  CLEAR_SKY = 0,
  MAINLY_CLEAR = 1,
  PARTLY_CLOUDY = 2,
  OVERCAST = 3,
  FOG = 45,
  DEPOSITING_RIME_FOG = 48,
  DRIZZLE_LIGHT = 51,
  DRIZZLE_MODERATE = 53,
  DRIZZLE_DENSE = 55,
  FREEZING_DRIZZLE_LIGHT = 56,
  FREEZING_DRIZZLE_DENSE = 57,
  RAIN_SLIGHT = 61,
  RAIN_MODERATE = 63,
  RAIN_HEAVY = 65,
  FREEZING_RAIN_LIGHT = 66,
  FREEZING_RAIN_HEAVY = 67,
  SNOW_SLIGHT = 71,
  SNOW_MODERATE = 73,
  SNOW_HEAVY = 75,
  SNOW_GRAINS = 77,
  RAIN_SHOWERS_SLIGHT = 80,
  RAIN_SHOWERS_MODERATE = 81,
  RAIN_SHOWERS_VIOLENT = 82,
  SNOW_SHOWERS_SLIGHT = 85,
  SNOW_SHOWERS_HEAVY = 86,
  THUNDERSTORM = 95,
  THUNDERSTORM_SLIGHT_HAIL = 96,
  THUNDERSTORM_HEAVY_HAIL = 99,
}



export function enumToString(code: WeatherCode): string {
  const name: string = WeatherCode[code];
  if (!name) 
    throw new Error(`Unknown WeatherCode: ${code}`);
  return name
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function weatherCodeToIcon(code: WeatherCode): string {
  switch (code) {
    case WeatherCode.CLEAR_SKY:
      return "☀️";
    case WeatherCode.MAINLY_CLEAR:
      return "🌤️";
    case WeatherCode.PARTLY_CLOUDY:
      return "⛅";
    case WeatherCode.OVERCAST:
      return "☁️";
    case WeatherCode.FOG:
    case WeatherCode.DEPOSITING_RIME_FOG:
      return "🌫️";
    case WeatherCode.DRIZZLE_LIGHT:
    case WeatherCode.DRIZZLE_MODERATE:
    case WeatherCode.DRIZZLE_DENSE:
      return "🌦️";
    case WeatherCode.FREEZING_DRIZZLE_LIGHT:
    case WeatherCode.FREEZING_DRIZZLE_DENSE:
      return "🌧️❄️";
    case WeatherCode.RAIN_SLIGHT:
      return "🌦️";
    case WeatherCode.RAIN_MODERATE:
      return "🌧️";
    case WeatherCode.RAIN_HEAVY:
      return "🌧️💧";
    case WeatherCode.FREEZING_RAIN_LIGHT:
    case WeatherCode.FREEZING_RAIN_HEAVY:
      return "🌨️";
    case WeatherCode.SNOW_SLIGHT:
      return "🌨️";
    case WeatherCode.SNOW_MODERATE:
      return "❄️";
    case WeatherCode.SNOW_HEAVY:
      return "❄️❄️";
    case WeatherCode.SNOW_GRAINS:
      return "🌨️";
    case WeatherCode.RAIN_SHOWERS_SLIGHT:
      return "🌦️";
    case WeatherCode.RAIN_SHOWERS_MODERATE:
      return "🌧️";
    case WeatherCode.RAIN_SHOWERS_VIOLENT:
      return "⛈️";
    case WeatherCode.SNOW_SHOWERS_SLIGHT:
    case WeatherCode.SNOW_SHOWERS_HEAVY:
      return "🌨️❄️";
    case WeatherCode.THUNDERSTORM:
      return "⛈️";
    case WeatherCode.THUNDERSTORM_SLIGHT_HAIL:
      return "⛈️🌨️";
    case WeatherCode.THUNDERSTORM_HEAVY_HAIL:
      return "⛈️🌩️";
  }
}