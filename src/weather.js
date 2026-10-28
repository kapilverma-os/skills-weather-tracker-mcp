const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const CURRENT_FIELDS = 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code';

// Describe an error returned while requesting Open-Meteo data.
export class WeatherApiError extends Error {
  // Create an API error with a user-facing message.
  constructor(message) {
    super(message);
    this.name = 'WeatherApiError';
  }
}

// Translate a WMO weather code into a short readable condition.
export function weatherCodeToCondition(code) {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if ([51, 53, 55].includes(code)) return 'Drizzle';
  if ([56, 57].includes(code)) return 'Freezing drizzle';
  if ([61, 63, 65].includes(code)) return 'Rain';
  if ([66, 67].includes(code)) return 'Freezing rain';
  if ([71, 73, 75, 77].includes(code)) return 'Snow';
  if ([80, 81, 82].includes(code)) return 'Rain showers';
  if ([85, 86].includes(code)) return 'Snow showers';
  if (code === 95) return 'Thunderstorm';
  if (code === 96 || code === 99) return 'Thunderstorm with hail';
  return 'Unknown conditions';
}

// Fetch JSON from Open-Meteo and convert network or response errors to friendly messages.
async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new WeatherApiError('Could not reach Open-Meteo. Check your network connection and try again.');
  }

  if (!response.ok) {
    throw new WeatherApiError(`Open-Meteo returned HTTP ${response.status}. Try again later.`);
  }

  try {
    return await response.json();
  } catch {
    throw new WeatherApiError('Open-Meteo returned an invalid response. Try again later.');
  }
}

// Look up a city and return its current weather in the database's field names.
export async function fetchWeatherForCity(city) {
  const geocodingUrl = new URL(GEOCODING_URL);
  geocodingUrl.search = new URLSearchParams({ name: city, count: '1', language: 'en' });
  const geocoding = await fetchJson(geocodingUrl);
  const location = geocoding.results?.[0];

  if (!location) return null;

  const forecastUrl = new URL(FORECAST_URL);
  forecastUrl.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: CURRENT_FIELDS,
  });
  const forecast = await fetchJson(forecastUrl);
  const current = forecast.current;

  if (!current || !Number.isFinite(current.temperature_2m)
    || !Number.isFinite(current.relative_humidity_2m)
    || !Number.isFinite(current.wind_speed_10m)
    || !Number.isFinite(current.weather_code)) {
    throw new WeatherApiError('Open-Meteo did not return complete current weather data. Try again later.');
  }

  return {
    city: location.name,
    country: location.country ?? null,
    latitude: location.latitude,
    longitude: location.longitude,
    temperatureC: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    windKmh: current.wind_speed_10m,
    condition: weatherCodeToCondition(current.weather_code),
    weatherCode: current.weather_code,
  };
}