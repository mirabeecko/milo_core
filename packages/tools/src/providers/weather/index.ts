import { z } from "zod";
import type { Tool, ToolContext } from "../../types/index.js";

const weatherForecastSchema = z.object({
  location: z.string().min(1),
  days: z.number().min(1).max(14).optional(),
});

export interface WeatherForecast {
  location: string;
  latitude: number;
  longitude: number;
  days: Array<{
    date: string;
    maxWindSpeedKmh: number;
    maxWindGustsKmh: number;
    dominantWindDirection: number;
  }>;
}

interface GeoResult {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
  }>;
}

interface ForecastResult {
  daily: {
    time: string[];
    windspeed_10m_max: number[];
    windgusts_10m_max: number[];
    winddirection_10m_dominant: number[];
  };
}

export class WeatherForecastTool implements Tool<z.infer<typeof weatherForecastSchema>, WeatherForecast> {
  readonly id = "weather:forecast";
  readonly description = "Get a real weather forecast (wind, temperature) for a location using Open-Meteo";
  readonly parameters = weatherForecastSchema;

  async execute(input: z.infer<typeof weatherForecastSchema>, _context: ToolContext): Promise<WeatherForecast> {
    const days = input.days ?? 3;
    const geo = await this.geocode(input.location);
    if (!geo) {
      throw new Error(`Location not found: ${input.location}`);
    }

    const forecast = await this.fetchForecast(geo.latitude, geo.longitude, days);
    return {
      location: `${geo.name}${geo.country ? `, ${geo.country}` : ""}`,
      latitude: geo.latitude,
      longitude: geo.longitude,
      days: forecast,
    };
  }

  private async geocode(location: string): Promise<{ name: string; latitude: number; longitude: number; country?: string } | null> {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", location);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "cs");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as GeoResult;
    const result = data.results?.[0];
    if (!result) {
      return null;
    }

    return {
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      country: result.country,
    };
  }

  private async fetchForecast(latitude: number, longitude: number, days: number): Promise<WeatherForecast["days"]> {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("daily", "windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", String(days));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Forecast failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ForecastResult;
    const daily = data.daily;

    return daily.time.map((date, index) => ({
      date,
      maxWindSpeedKmh: daily.windspeed_10m_max[index] ?? 0,
      maxWindGustsKmh: daily.windgusts_10m_max[index] ?? 0,
      dominantWindDirection: daily.winddirection_10m_dominant[index] ?? 0,
    }));
  }
}

export function registerWeatherTools(registry: { register(tool: Tool): void }): void {
  registry.register(new WeatherForecastTool());
}
