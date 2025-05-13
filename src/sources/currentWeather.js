import { FlatCache, createFromFile } from 'flat-cache';
import fetch from 'node-fetch';
import { loadConfig } from "../loadConfig.js";
import path from "path";
import { renderTextGif, TextContent } from '../renderGifText.js';

function buildOpenMeteoUrl() {
  return `https://api.open-meteo.com/v1/forecast?latitude=40.599556&longitude=-105.061683&current=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation_probability&timezone=America%2FDenver&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch`;
}

async function fetchWeatherData() {
  const url = buildOpenMeteoUrl();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch weather data: ${res.status}`);
  const data = await res.json();

  return data;
}

function extractRelevantData(data, hours) {
  return data.current;
}

function getCardinalDirection(degrees) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export async function currentWeather() {
  const data = await fetchWeatherData();
  const temperature = data.current.temperature_2m;
  const windSpeed = data.current.wind_speed_10m;
  const windGusts = data.current.wind_gusts_10m;
  const windDirection = data.current.wind_direction_10m;
  const precipitationProbability = data.current.precipitation_probability;

  const textItem = new TextContent({
    content: 'WEATHER!',
    fontName: "Tiny5-Regular", // Replace with your actual font JSON name (without .json)
    x: 0,
    y: 0,
    color: "#333",
    lineSpacing: -7
  });

  return await renderTextGif([
    {
      content: String(Math.round(temperature)) + 'F',
      fontName: 'profont17',
      x: 1,
      y: 0,
      color: '#9C5A2D'
    },
    {
      content: "Wind   Gusts From",
      fontName: 'Tiny5-Regular',
      x: 1,
      y: 15,
      color: '#333333'
    },
    {
      content:  String(Math.round(windSpeed)) + 'mph',
      fontName: 'Tiny5-Regular',
      x: 1,
      y: 21,
      color: '#4a5b44'
    },
    {
      content:  String(Math.round(windGusts)) + 'mph',
      fontName: 'Tiny5-Regular',
      x: 23,
      y: 21,
      color: '#4a5b44'
    },
    {
      content:  getCardinalDirection(windDirection),
      fontName: 'Tiny5-Regular',
      x: 48,
      y: 21,
      color: '#4a5b44'
    },
    {
      content:  'Rain?',
      fontName: 'Tiny5-Regular',
      x: 30,
      y: 1,
      color: '#333'
    },
    {
      content:  precipitationProbability + '%',
      fontName: 'Tiny5-Regular',
      x: 30,
      y: 8,
      color: '#445566'
    },


    
  
  ], 5000)

}
