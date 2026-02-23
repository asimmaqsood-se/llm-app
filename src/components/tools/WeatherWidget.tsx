import { WeatherWidget } from "@/components/tool-ui/weather-widget/runtime";

export function Example() {
  return (
    <WeatherWidget
      version="3.1"
      id="weather-widget-example"
      location={{ name: "Kansas City, MO" }}
      units={{ temperature: "fahrenheit" }}
      current={{
        temperature: 72,
        tempMin: 65,
        tempMax: 78,
        conditionCode: "thunderstorm",
      }}
      forecast={[
        { label: "Tue", tempMin: 62, tempMax: 75, conditionCode: "heavy-rain" },
        { label: "Wed", tempMin: 58, tempMax: 70, conditionCode: "rain" },
        { label: "Thu", tempMin: 55, tempMax: 68, conditionCode: "cloudy" },
        {
          label: "Fri",
          tempMin: 52,
          tempMax: 72,
          conditionCode: "partly-cloudy",
        },
        { label: "Sat", tempMin: 58, tempMax: 76, conditionCode: "clear" },
      ]}
      time={{ localTimeOfDay: 22 / 24 }}
      updatedAt="2026-01-28T22:00:00Z"
    />
  );
}