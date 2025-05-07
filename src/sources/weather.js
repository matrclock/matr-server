import { FlatCache, createFromFile } from 'flat-cache';
import fetch from 'node-fetch';
import { loadConfig } from "../loadConfig.js";
import path from "path";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

dayjs.extend(utc);
dayjs.extend(timezone);

const config = await loadConfig();
const apiKey = config.sources.google.key;

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  temperature: 0,
  apiKey: apiKey,
});

// Setup flat-cache with TTL
const cache = new FlatCache({
  cacheId: "weather-cache",
  cacheDir: path.resolve(".cache"),
  ttl: 30 * 60 * 1000, // 30 minutes TTL
  lruSize: 1000,
  expirationInterval: 5 * 60 * 1000, // optional: auto-expire
});
cache.load('weather-cache');

const hoursToSummarize = [9, 13]; // 9am and 1pm

function getForecastDay() {
  const now = dayjs().tz("America/Denver");
  return now.hour() >= 14 ? 2 : 1;
}

function buildOpenMeteoUrl(forecastDays) {
  return `https://api.open-meteo.com/v1/forecast?latitude=40.599556&longitude=-105.061683&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation_probability&timezone=America%2FDenver&forecast_days=${forecastDays}&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch`;
}

async function fetchWeatherData() {
  const forecastDay = getForecastDay();
  const targetDate = dayjs().tz("America/Denver").add(forecastDay - 1, 'day').format("YYYY-MM-DD");
  const cacheKey = `weather-${targetDate}`;
  const cached = cache.getKey(cacheKey);

  if (cached) {
    return cached;
  }

  const url = buildOpenMeteoUrl(forecastDay);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch weather data: ${res.status}`);
  const data = await res.json();
  console.log("Fetched weather data:", data);

  cache.setKey(cacheKey, data);
  return data;
}

function extractRelevantData(data, hours) {
  const now = dayjs().tz("America/Denver");
  const targetDate = now.add(getForecastDay() - 1, 'day').format("YYYY-MM-DD");

  const result = [];
  for (const hour of hours) {
    const hourStr = `${targetDate}T${hour.toString().padStart(2, "0")}:00`;
    const index = data.hourly.time.findIndex((t) => t === hourStr);
    if (index !== -1) {
      result.push({
        time: data.hourly.time[index],
        temperature: data.hourly.temperature_2m[index],
        wind_speed: data.hourly.wind_speed_10m[index],
        wind_gusts: data.hourly.wind_gusts_10m[index],
        wind_direction: data.hourly.wind_direction_10m[index],
        precipitation_probability: data.hourly.precipitation_probability[index],
      });
    }
  }
  return result;
}

async function summarizeWithGemini(weatherData) {
  const systemPrompt = "You are a kid reading the weather. Summarize the weather data provided to you in a concise and informative manner. Keep it brief, just the facts, no technical jargon.";

  const date = dayjs(weatherData[0].time).tz("America/Denver").format("dddd, MMMM D");
  const userPrompt = `Summarize the weather at both 9am and 1pm on ${date} from this data:\n\n${JSON.stringify(weatherData, null, 2)}\n\n
                      State the day of the week first.
                      Keep the summary short or the listener will change the station. Include temperature, wind speed, gusts, direction, and precipitation probability.
                      Avoid words like "is" use "will be" instead. Seriously, keep it short. No newlines or bullet points. Round the numbers. Don't insert a space between the number and the unit.
                      Translate wind direction from degrees to shorthand cardinal directions (e.g., 0° = N, 90° = E, 180° = S, 270° = W). Plain text only, no markup or code blocks.
                      Include what the chance of precipitation means in plain English. For example, "Chance of rain is 20%." or "Chance of rain is 0%.".
                      Number in precipitation_probability is the chance of rain, not the amount. For example 1 means 1%

                      You'll use MIRC style color codes to set number colors. Use \x03RRGGBB format. For example, \x039C5A2D is a greenish color.
                      Use \x03 for the first color and \x0F to reset it. For example, \x039C5A2D\x0F.
                      When you encounter a temperature, set the number to dim mutedorange, along with the unit.
                      Wind related numbers should be a dim desaturated green, including the unit. 
                      Precipitation probability, the number and unit,  should be a dim muted blue color.
                      All other colors should be dim and muted, not bright.

                      For example \x039C5A2D20%\x0F or \x039C5A2D65F\x0F or \x039C5A2D5mph\x0F
                     `;

  const response = await llm.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]);

  return response.text.trim();
}

export async function weather() {
  const summaryCacheKey = `weather-summary`;
  const cachedSummary = cache.getKey(summaryCacheKey);

  console.log("Weather summary cache:", cachedSummary);
  if (cachedSummary) {
    console.log("Using cached summary");
    return cachedSummary;
  }

  const fullWeather = await fetchWeatherData();
  const relevant = extractRelevantData(fullWeather, hoursToSummarize);

  try {
    const summary = await summarizeWithGemini(relevant);
    cache.setKey(summaryCacheKey, summary);
    cache.save();

    console.log("Weather summary:", summary);
    return summary;
  } catch (error) {
    console.log("Error summarizing weather data:", error);
    return "Weather probably hit a rate limit. Try again later.";
  }
  
}
