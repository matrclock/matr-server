import { OpenAI } from "openai";
import fetch from 'node-fetch';
import { loadConfig } from "../loadConfig.js";
import { FlatCache } from "flat-cache";
import path from "path";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const config = await loadConfig();
const apiKey = config.sources.openai.key;

const openai = new OpenAI({ apiKey });

const CACHE_TTL = 1000 * 60 * 30; // 30 minutes
const CACHE_ID = "weather-cache";
const CACHE_PATH = path.resolve(".cache");
const cache = new FlatCache({ cacheId: CACHE_ID, cacheDir: CACHE_PATH });

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

  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  const url = buildOpenMeteoUrl(forecastDay);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch weather data: ${res.status}`);
  const data = await res.json();

  cache.setKey(cacheKey, { data, timestamp: Date.now() });
  cache.save();

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

async function summarizeWithChatGPT(weatherData) {
  const systemPrompt = "You are radio weather announcer. You summarize the weather data provided to you in a concise and informative manner. You are not a meteorologist, so avoid using technical jargon. Keep it short or the audience will change the station. Just the facts, nothing extra.";

  const date = dayjs(weatherData[0].time).tz("America/Denver").format("dddd, MMMM D");
  const userPrompt = `Summarize the weather at both 9am and 1pm on ${date} from this data:\n\n${JSON.stringify(weatherData, null, 2)}\n\n
                      You're forecasting here, so avoid definite articles like "is". \n\n
                      Be sure to include the temperature, wind speed, wind gusts, wind direction, and precipitation probability.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
  });

  return response.choices[0].message.content.trim();
}

export async function weather() {
  const fullWeather = await fetchWeatherData();
  const relevant = extractRelevantData(fullWeather, hoursToSummarize);
  let summary = "";
  try {
    summary = await summarizeWithChatGPT(relevant);
  } catch (error) {
    summary = "Weather probably hit a rate limit. Try again later.";
  }
  return summary;
}