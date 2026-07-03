export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("cs-CZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("cs-CZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes} min ${remainingSeconds} s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} h ${remainingMinutes} min`;
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffMin < 1) return "právě teď";
  if (diffMin < 60) return `před ${diffMin} min`;
  if (diffHours < 24) return `před ${diffHours} h`;
  if (diffDays === 1) return "včera";
  return `před ${diffDays} dny`;
}

export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case "critical":
      return "Kritická";
    case "important":
      return "Důležitá";
    case "low":
      return "Může počkat";
    default:
      return priority;
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "critical":
      return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    case "important":
      return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "low":
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Aktivní";
    case "idle":
      return "Nečinný";
    case "paused":
      return "Pozastaveno";
    case "error":
      return "Chyba";
    case "running":
      return "Běží";
    case "disabled":
      return "Vypnuto";
    case "on_hold":
      return "Pozastaveno";
    case "completed":
      return "Dokončeno";
    case "archived":
      return "Archivováno";
    default:
      return status;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "active":
    case "running":
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    case "idle":
      return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    case "paused":
    case "on_hold":
      return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "error":
    case "disabled":
      return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    case "completed":
      return "text-purple-500 bg-purple-500/10 border-purple-500/20";
    case "archived":
      return "text-muted-foreground bg-muted border-border";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
}

export function getSourceLabel(source: string): string {
  switch (source) {
    case "obsidian":
      return "Obsidian";
    case "drive":
      return "Google Drive";
    case "gmail":
      return "Gmail";
    case "upload":
      return "Upload";
    case "isds":
      return "ISDS";
    default:
      return source;
  }
}

export function getSourceColor(source: string): string {
  switch (source) {
    case "obsidian":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "drive":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "gmail":
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    case "upload":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "isds":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
