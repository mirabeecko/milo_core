"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Plus, RefreshCw, Tag, Eye, Star } from "lucide-react";

const API = "http://localhost:4000";

export default function IdeasPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/phone-tracker/spyg/watchlist`);
      const data = await res.json();
      setItems((data.items || []).reverse());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addIdea = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    try {
      await fetch(`${API}/phone-tracker/spyg/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newText,
          description: newDesc,
          tags: newTags.split(",").map((t: string) => t.trim()).filter(Boolean),
        }),
      });
      setNewText("");
      setNewDesc("");
      setNewTags("");
      await fetchItems();
    } catch (e) {
      console.error(e);
    }
    setAdding(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="💡 Schránka nápadů"
        description="Nápady, plánované úkoly, vize — nic se neztratí"
        icon={Lightbulb}
        actions={
          <Button variant="outline" size="sm" onClick={fetchItems}>
            <RefreshCw className="w-4 h-4 mr-1" /> Obnovit
          </Button>
        }
      />

      {/* ADD IDEA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nový nápad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Nápad nebo úkol..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addIdea()}
          />
          <Textarea
            placeholder="Popis (volitelný)..."
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Input
              placeholder="Tagy (čárkou): hlas, dashboard, vize..."
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addIdea} disabled={adding || !newText.trim()}>
              {adding ? "..." : "Přidat"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* IDEAS LIST */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-30" />
            Zatím žádné nápady. Přidej první!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => (
            <Card key={item.id} className={`hover:border-primary/30 transition-colors ${item.gamechanger ? "border-yellow-500/30" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {item.gamechanger && <Star className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{item.text}</span>
                      {item.tags?.map((t: string) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />{t}
                        </Badge>
                      ))}
                      <Badge variant={item.status === "pending" ? "secondary" : "default"} className="text-xs">
                        {item.status}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {item.source}
                      </span>
                      <span>Důležitost: {item.importance}/10</span>
                      <span>{new Date(item.firstSeen).toLocaleDateString("cs-CZ")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
