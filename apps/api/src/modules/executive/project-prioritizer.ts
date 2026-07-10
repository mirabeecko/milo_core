/**
 * Project Prioritizer — C-005 capability.
 * Čte z milo-os/projects.json a řadí projekty podle priority pro Vlastníka.
 */
import { readFileSync, existsSync } from "node:fs";
const PROJECTS_PATH = "/Users/mb/dev/milo-os/projects.json";

interface Project {
  name: string;
  path: string;
  status: string;
  progress: number;
  rating: number;
  description?: string;
  tags?: string[];
}

interface PrioritizedProject extends Project {
  priorityScore: number;
  reason: string;
}

export function prioritizeProjects(): {
  top5: PrioritizedProject[];
  active: number;
  finished: number;
  byStatus: Record<string, number>;
  updatedAt: string;
} {
  if (!existsSync(PROJECTS_PATH)) {
    return { top5: [], active: 0, finished: 0, byStatus: {}, updatedAt: "N/A" };
  }

  const data = JSON.parse(readFileSync(PROJECTS_PATH, "utf-8"));
  const projects: Project[] = data.projects || [];
  const byStatus: Record<string, number> = {};

  const scored: PrioritizedProject[] = projects.map((p) => {
    byStatus[p.status] = (byStatus[p.status] || 0) + 1;

    // Skóre: progres (čím víc hotovo, tím spíš dokončit) + rating (kvalita)
    // Aktivní projekty s vysokým progresem a vysokým ratingem = priorita
    let score = 0;
    let reason = "";

    if (p.status === "Před finišem") {
      score = p.progress + p.rating * 5; // téměř hotovo = priorita
      reason = `Téměř hotovo (${p.progress}%) — dokončit`;
    } else if (p.status === "Nasazeno / testování") {
      score = p.progress * 0.8 + p.rating * 4;
      reason = `V testování (${p.progress}%) — ověřit a nasadit`;
    } else if (p.status === "Rozděláno") {
      score = p.progress * 0.5 + p.rating * 3;
      reason = `Rozpracováno (${p.progress}%) — pokračovat`;
    } else if (p.status === "Nápad / koncept") {
      score = p.rating * 1;
      reason = `Koncept (rating ${p.rating}) — zvážit spuštění`;
    } else {
      score = 0;
      reason = "Dokončeno nebo archivováno";
    }
    return { ...p, priorityScore: Math.round(score), reason };
  });

  scored.sort((a, b) => b.priorityScore - a.priorityScore);

  const active = scored.filter((p) =>
    ["Rozděláno", "Před finišem", "Nasazeno / testování", "Nápad / koncept"].includes(p.status),
  );

  return {
    top5: active.slice(0, 5),
    active: active.length,
    finished: projects.length - active.length,
    byStatus,
    updatedAt: data.updated_at || "unknown",
  };
}
