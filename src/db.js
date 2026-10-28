import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

const databasePath = fileURLToPath(new URL('../weather.db', import.meta.url));
const database = new Database(databasePath);

// Store one weather observation using a prepared statement.
export function insertWeatherLog(weather) {
  return database.prepare(`
    INSERT INTO weather_logs (
      city, country, latitude, longitude, temperature_c,
      humidity, wind_kmh, condition, weather_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    weather.city,
    weather.country,
    weather.latitude,
    weather.longitude,
    weather.temperatureC,
    weather.humidity,
    weather.windKmh,
    weather.condition,
    weather.weatherCode,
  );
}

// Return the newest observations, limited by the caller.
export function getRecentLogs(limit = 10) {
  return database.prepare(`
    SELECT id, city, country, temperature_c, humidity, wind_kmh,
      condition, weather_code, created_at
    FROM weather_logs
    ORDER BY datetime(created_at) DESC, id DESC
    LIMIT ?
  `).all(limit);
}

// Aggregate temperature and count for a case-insensitive city name.
export function getCityStats(city) {
  return database.prepare(`
    SELECT MIN(temperature_c) AS min_temperature,
      MAX(temperature_c) AS max_temperature,
      AVG(temperature_c) AS average_temperature,
      COUNT(*) AS log_count
    FROM weather_logs
    WHERE city = ? COLLATE NOCASE
  `).get(city);
}

// Close the database connection after the command completes.
export function closeDatabase() {
  database.close();
}