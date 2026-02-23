"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Cloud, Wind, Droplets, Thermometer } from "lucide-react";

type WeatherArgs = {
  location: string;
  unit?: "celsius" | "fahrenheit";
};

type WeatherResult = {
  location: string;
  temperature: number;
  unit: string;
  condition: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
};

const weatherIcons: Record<string, string> = {
  Sunny: "☀️", "Partly Cloudy": "⛅", Overcast: "☁️", "Light Rain": "🌦️",
  "Heavy Rain": "🌧️", Thunderstorm: "⛈️", Snow: "❄️", Foggy: "🌫️", Windy: "💨", Clear: "🌙",
};

export const WeatherToolUI = makeAssistantToolUI<WeatherArgs, WeatherResult>({
  toolName: "weather",
  render: ({ args, result, status }) => {
    if (status.type === "running") {
      return (
        <div className="my-3 rounded-xl border border-sky-200 bg-linear-to-br from-sky-50 to-blue-50 p-4 max-w-xs">
          <div className="flex items-center gap-2 text-sky-600">
            <Cloud className="w-4 h-4 animate-bounce" />
            <span className="text-sm font-medium">Fetching weather for {args?.location ?? "..."}...</span>
          </div>
        </div>
      );
    }

    if (result) {
      const icon = weatherIcons[result.condition] ?? "🌡️";
      return (
        <div className="my-3 rounded-xl border border-sky-200 bg-linear-to-br from-sky-50 to-blue-50 p-4 max-w-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-sky-900 text-sm">{result.location}</p>
              <p className="text-sky-600 text-xs mt-0.5">{result.condition}</p>
            </div>
            <span className="text-3xl">{icon}</span>
          </div>
          <div className="flex items-end gap-1 mb-4">
            <span className="text-4xl font-light text-sky-900">{result.temperature}</span>
            <span className="text-xl text-sky-600 mb-1">{result.unit}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center gap-1 bg-white/50 rounded-lg p-2">
              <Thermometer className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs text-gray-500">Feels like</span>
              <span className="text-xs font-semibold">{result.feelsLike}{result.unit}</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-white/50 rounded-lg p-2">
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs text-gray-500">Humidity</span>
              <span className="text-xs font-semibold">{result.humidity}%</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-white/50 rounded-lg p-2">
              <Wind className="w-3.5 h-3.5 text-teal-500" />
              <span className="text-xs text-gray-500">Wind</span>
              <span className="text-xs font-semibold">{result.windSpeed} km/h</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  },
});