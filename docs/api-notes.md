# Open-Meteo API Notes

No API key is required for these requests.

## Geocoding

Endpoint: `https://geocoding-api.open-meteo.com/v1/search?name=Pune&count=1`

The first entry in `results` supplies the city name, country, and coordinates. We use `name` for `city`, `country` for `country`, and `latitude` / `longitude` for the logged location.

Trimmed live response:

```json
{
  "results": [
    {
      "name": "Pune",
      "latitude": 18.51957,
      "longitude": 73.85535,
      "country": "India"
    }
  ]
}
```

## Current Weather

Endpoint: `https://api.open-meteo.com/v1/forecast?latitude=18.51957&longitude=73.85535&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`

The `current` object supplies `temperature_2m` (°C), `relative_humidity_2m` (%), `wind_speed_10m` (km/h), and `weather_code` (WMO code). These map to `temperature_c`, `humidity`, `wind_kmh`, and `weather_code`. Open-Meteo returns a numeric code rather than a condition label; code `1` maps to “Mainly clear” for the `condition` field.

Trimmed live response:

```json
{
  "current_units": {
    "temperature_2m": "°C",
    "relative_humidity_2m": "%",
    "wind_speed_10m": "km/h",
    "weather_code": "wmo code"
  },
  "current": {
    "time": "2026-10-28T15:00",
    "temperature_2m": 27.9,
    "relative_humidity_2m": 45,
    "wind_speed_10m": 9.8,
    "weather_code": 1
  }
}
```

The forecast response reports its own grid-point coordinates, which may differ slightly from the geocoded coordinates stored for the city.