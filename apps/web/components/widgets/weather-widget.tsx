"use client";

import { Cloud, CloudFog, CloudLightning, CloudRain, Snowflake, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeatherData } from "@/lib/types";

const conditionIcons: Record<WeatherData["condition"], React.ElementType> = {
  clear: Sun,
  cloudy: Cloud,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudLightning,
  fog: CloudFog,
};

const conditionLabels: Record<WeatherData["condition"], string> = {
  clear: "Slunečno",
  cloudy: "Zataženo",
  rain: "Déšť",
  snow: "Sníh",
  storm: "Bouřka",
  fog: "Mlha",
};

export function WeatherWidget({ weather }: { weather: WeatherData }): JSX.Element {
  const Icon = conditionIcons[weather.condition];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Počasí · {weather.location}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-bold tracking-tight">
              {weather.temperature}°
            </div>
            <div className="text-sm text-muted-foreground">
              {conditionLabels[weather.condition]} · pocitově {weather.feelsLike}°
            </div>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="h-8 w-8" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-border bg-card/50 p-2">
            <span className="text-muted-foreground">Vlhkost</span>
            <div className="font-medium">{weather.humidity}%</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-2">
            <span className="text-muted-foreground">Vítr</span>
            <div className="font-medium">{weather.windSpeed} km/h</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Předpověď</div>
          <div className="flex gap-2">
            {weather.forecast.map((item) => {
              const ForecastIcon = conditionIcons[item.condition];
              return (
                <div
                  key={item.time}
                  className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-border bg-card/50 p-2"
                >
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                  <ForecastIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{item.temperature}°</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
