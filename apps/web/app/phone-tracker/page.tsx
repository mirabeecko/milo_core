"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapPin,
  RefreshCw,
  Navigation,
  Clock,
  Satellite,
  Wifi,
  Loader2,
  Crosshair,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";

const API = "http://localhost:4000";

interface LocationPoint {
  id: number;
  lat: number;
  lng: number;
  accuracy: string | null;
  files: string[];
  timestamp: string;
}

interface QueryResult {
  query: { from: string; to: string };
  count: number;
  points: LocationPoint[];
  summary: string;
  agent: string;
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString("cs-CZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}

export default function PhoneTrackerPage() {
  const [data, setData] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${API}/phone-tracker/query`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba načítání");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // auto-refresh 60s
    return () => clearInterval(interval);
  }, [loadData]);

  const sendCurrentLocation = async () => {
    setSending(true);
    setSendStatus(null);
    try {
      // Get real location from ipapi.co
      const geoRes = await fetch("https://ipapi.co/json/");
      if (!geoRes.ok) throw new Error("Geolocation failed");
      const geo = await geoRes.json();

      const payload = {
        lat: geo.latitude,
        lng: geo.longitude,
        accuracy: 50,
        timestamp: new Date().toISOString(),
      };

      const res = await fetch(`${API}/phone-tracker/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      setSendStatus(
        `✅ Poloha odeslána: ${geo.latitude}, ${geo.longitude} (${geo.city || "?"}) — ID: ${result.id}`,
      );
      await loadData();
    } catch (err) {
      setSendStatus(
        `❌ Chyba: ${err instanceof Error ? err.message : "neznámá"}`,
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="📡 Phone Tracker"
        description="Sledování polohy telefonu — data z mobilního klienta"
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Obnovit
          </Button>
          <Button
            size="sm"
            onClick={sendCurrentLocation}
            disabled={sending}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4 mr-2" />
            )}
            Odeslat aktuální polohu
          </Button>
        </div>
      </PageHeader>

      {sendStatus && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            sendStatus.startsWith("✅")
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {sendStatus}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Záznamů
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : (data?.count ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Poslední záznam
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {loading ? (
                <Skeleton className="h-5 w-32" />
              ) : data?.points?.[0] ? (
                formatTimestamp(data.points[0].timestamp)
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Poslední poloha
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">
              {loading ? (
                <Skeleton className="h-5 w-40" />
              ) : data?.points?.[0] ? (
                `${data.points[0].lat.toFixed(4)}, ${data.points[0].lng.toFixed(4)}`
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      {data?.summary && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <p className="text-sm">{data.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Data table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Historie poloh
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : !data?.points?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Žádná data. Klikněte na &quot;Odeslat aktuální polohu&quot;.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">GPS</th>
                    <th className="py-2 pr-4 font-medium">Přesnost</th>
                    <th className="py-2 pr-4 font-medium">Čas</th>
                    <th className="py-2 font-medium">Soubory</th>
                  </tr>
                </thead>
                <tbody>
                  {data.points.map((point, i) => (
                    <tr
                      key={point.id}
                      className={`border-b border-border/20 hover:bg-accent/50 transition-colors ${
                        i === 0 ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline" className="font-mono text-xs">
                          #{point.id}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs">
                        <a
                          href={`https://www.google.com/maps?q=${point.lat},${point.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Navigation className="h-3 w-3" />
                          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                        </a>
                      </td>
                      <td className="py-2.5 pr-4">
                        {point.accuracy ? (
                          <span className="flex items-center gap-1">
                            <Satellite className="h-3 w-3 text-muted-foreground" />
                            {point.accuracy}m
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {formatTimestamp(point.timestamp)}
                      </td>
                      <td className="py-2.5">
                        {point.files.length > 0 ? (
                          <span className="text-xs text-muted-foreground">
                            {point.files.join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
