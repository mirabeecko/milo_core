import { getProjects } from "./service.js";
import { scanProjects } from "./scan.js";

export async function refreshProjects(): Promise<void> {
  const scanned = await scanProjects();
  const existing = getProjects();
  
  // Merge scanned with existing (preserve manual edits)
  const merged = existing.map((existing) => {
    const scanned = scanned.find((s) => s.name === existing.name);
    if (!scanned) return existing;
    
    return {
      ...existing,
      ...scanned,
      // Don't overwrite manual fields
      goal: existing.goal ?? scanned.goal,
      status: existing.status ?? scanned.status,
      done_summary: existing.done_summary ?? scanned.done_summary,
      remaining_summary: existing.remaining_summary ?? scanned.remaining_summary,
      time_spent_hours: existing.time_spent_hours ?? scanned.time_spent_hours,
      time_estimate_hours: existing.time_estimate_hours ?? scanned.time_estimate_hours,
      cost_spent: existing.cost_spent ?? scanned.cost_spent,
      cost_estimate: existing.cost_estimate ?? scanned.cost_estimate,
      last_updated: new Date().toISOString(),
    };
  });

  // Add new scanned projects
  for (const scanned of scanned) {
    if (!existing.find((e) => e.name === scanned.name)) {
      merged.push(scanned);
    }
  }

  // Save back
  const data = { projects: merged };
  const projectsFile = require("path").join(process.cwd(), "apps/api/data/projects.json");
  require("fs").writeFileSync(projectsFile, JSON.stringify(data, null, 2));
}
