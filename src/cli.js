import {
  closeDatabase,
  getCityStats,
  getRecentLogs,
  insertWeatherLog,
} from './db.js';
import { fetchWeatherForCity, WeatherApiError } from './weather.js';

const USAGE = `Usage:
  node src/cli.js add "<city>"
  node src/cli.js list [--limit N]
  node src/cli.js stats "<city>"`;

// Format an optional numeric value for compact CLI output.
function formatNumber(value) {
  return value == null ? '-' : Number(value).toFixed(1);
}

// Parse the supported optional list limit.
function parseListLimit(args) {
  if (args.length === 0) return 10;
  if (args.length !== 2 || args[0] !== '--limit') {
    throw new Error('Use list with an optional --limit N value.');
  }

  const limit = Number(args[1]);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error('The list limit must be a positive whole number.');
  }
  return limit;
}

// Fetch and save a city's current weather.
async function addCity(args) {
  const city = args.join(' ').trim();
  if (!city) throw new Error('Provide a city name.');

  const weather = await fetchWeatherForCity(city);
  if (!weather) {
    throw new Error(`No matching city found for "${city}". Check the spelling and try again.`);
  }

  const result = insertWeatherLog(weather);
  console.log(`Logged ${weather.city}, ${weather.country ?? 'unknown country'}: ${weather.temperatureC} C, ${weather.condition} (id ${result.lastInsertRowid}).`);
}

// Print the most recent observations as a table.
function listLogs(args) {
  const limit = parseListLimit(args);
  const logs = getRecentLogs(limit);
  if (logs.length === 0) {
    console.log('No weather logs found.');
    return;
  }

  console.table(logs.map((log) => ({
    ID: log.id,
    City: log.city,
    Country: log.country ?? '-',
    'Temp C': formatNumber(log.temperature_c),
    'Humidity %': log.humidity ?? '-',
    'Wind km/h': formatNumber(log.wind_kmh),
    Condition: log.condition ?? '-',
    Logged: log.created_at,
  })));
}

// Print temperature statistics for a city.
function showStats(args) {
  const city = args.join(' ').trim();
  if (!city) throw new Error('Provide a city name.');

  const stats = getCityStats(city);
  if (stats.log_count === 0) {
    console.log(`No weather logs found for "${city}".`);
    return;
  }

  console.log(`Weather statistics for ${city}:`);
  console.log(`  Logs: ${stats.log_count}`);
  console.log(`  Minimum: ${formatNumber(stats.min_temperature)} C`);
  console.log(`  Maximum: ${formatNumber(stats.max_temperature)} C`);
  console.log(`  Average: ${formatNumber(stats.average_temperature)} C`);
}

// Dispatch the CLI command and show actionable errors without stack traces.
async function main() {
  const [command, ...args] = process.argv.slice(2);

  try {
    if (command === 'add') {
      await addCity(args);
    } else if (command === 'list') {
      listLogs(args);
    } else if (command === 'stats') {
      showStats(args);
    } else {
      throw new Error(USAGE);
    }
  } catch (error) {
    if (error instanceof WeatherApiError) {
      console.error(error.message);
    } else if (error.message.startsWith('Usage:')) {
      console.error(error.message);
    } else if (error.message.startsWith('Provide ') || error.message.startsWith('Use list')
      || error.message.startsWith('The list limit') || error.message.startsWith('No matching city')) {
      console.error(error.message);
    } else {
      console.error('Could not complete the command. Check the database and try again.');
    }
    process.exitCode = 1;
  } finally {
    closeDatabase();
  }
}

await main();