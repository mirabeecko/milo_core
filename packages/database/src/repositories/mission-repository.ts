import type { Mission } from "@milo/shared";

export interface MissionRepository {
  findAll(options?: { status?: string; limit?: number }): Promise<Mission[]>;
  findById(id: string): Promise<Mission | null>;
  create(mission: Omit<Mission, "id" | "createdAt">): Promise<Mission>;
  update(id: string, partial: Partial<Mission>): Promise<Mission>;
  delete(id: string): Promise<void>;
}

export class InMemoryMissionRepository implements MissionRepository {
  private missions = new Map<string, Mission>();
  private counter = 0;

  async findAll(options?: { status?: string; limit?: number }): Promise<Mission[]> {
    let items = Array.from(this.missions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (options?.status) {
      items = items.filter((m) => m.status === options.status);
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    return items;
  }

  async findById(id: string): Promise<Mission | null> {
    return this.missions.get(id) ?? null;
  }

  async create(mission: Omit<Mission, "id" | "createdAt">): Promise<Mission> {
    this.counter += 1;
    const full: Mission = {
      ...mission,
      id: `mission-${this.counter}`,
      createdAt: new Date().toISOString(),
    };
    this.missions.set(full.id, full);
    return full;
  }

  async update(id: string, partial: Partial<Mission>): Promise<Mission> {
    const existing = this.missions.get(id);
    if (!existing) {
      throw new Error(`Mission ${id} not found`);
    }
    const updated: Mission = { ...existing, ...partial, id: existing.id };
    this.missions.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.missions.delete(id);
  }

  seed(missions: Mission[]): void {
    for (const mission of missions) {
      this.missions.set(mission.id, mission);
      const numericId = Number(mission.id.replace("mission-", ""));
      if (!Number.isNaN(numericId) && numericId > this.counter) {
        this.counter = numericId;
      }
    }
  }
}
