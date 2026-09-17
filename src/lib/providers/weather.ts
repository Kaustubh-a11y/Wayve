export interface WeatherData {
  summary: string;
  tempC: number;
  rainProbability: number;
  humidity: number;
  windSpeedKmh: number;
  isRaining: boolean;
}

function decodeWmoCode(code: number): { summary: string; rainProbability: number } {
  if (code === 0) return { summary: "Clear Sky", rainProbability: 0 };
  if (code === 1 || code === 2) return { summary: "Partly Cloudy", rainProbability: 10 };
  if (code === 3) return { summary: "Overcast", rainProbability: 25 };
  if (code >= 45 && code <= 48) return { summary: "Misty Fog", rainProbability: 20 };
  if (code >= 51 && code <= 55) return { summary: "Light Drizzle", rainProbability: 50 };
  if (code >= 61 && code <= 65) return { summary: "Rain Showers", rainProbability: 75 };
  if (code >= 80 && code <= 82) return { summary: "Heavy Showers", rainProbability: 90 };
  if (code >= 95) return { summary: "Thunderstorm Alert", rainProbability: 95 };
  return { summary: "Mild & Clear", rainProbability: 15 };
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

    const data = await res.json();
    const current = data.current || {};
    const wmo = decodeWmoCode(current.weather_code ?? 1);
    const hourlyRain = data.hourly?.precipitation_probability?.[0] ?? wmo.rainProbability;

    return {
      summary: wmo.summary,
      tempC: Math.round(current.temperature_2m ?? 24),
      rainProbability: hourlyRain,
      humidity: Math.round(current.relative_humidity_2m ?? 65),
      windSpeedKmh: Math.round(current.wind_speed_10m ?? 12),
      isRaining: hourlyRain > 50,
    };
  } catch {
    // Graceful offline fallback
    return {
      summary: "Clear · Mild Mountain Air",
      tempC: 24,
      rainProbability: 12,
      humidity: 62,
      windSpeedKmh: 14,
      isRaining: false,
    };
  }
}
