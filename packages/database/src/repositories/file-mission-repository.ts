import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { Mission } from "@milo/shared";
import { InMemoryMissionRepository, type MissionRepository } from "./mission-repository.js";

export class FileMissionRepository implements MissionRepository {
  private memory = new InMemoryMissionRepository();
  private initialized = false;
  private saving = false;
  private pendingSave = false;

  constructor(private filePath: string) {}

  async findAll(options?: { status?: string; limit?: number }): Promise<Mission[]> {
    await this.load();
    return this.memory.findAll(options);
  }

  async findById(id: string): Promise<Mission | null> {
    await this.load();
    return this.memory.findById(id);
  }

  async create(mission: Omit<Mission, "id" | "createdAt">): Promise<Mission> {
    await this.load();
    const created = await this.memory.create(mission);
    await this.persist();
    return created;
  }

  async update(id: string, partial: Partial<Mission>): Promise<Mission> {
    await this.load();
    const updated = await this.memory.update(id, partial);
    await this.persist();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.load();
    await this.memory.delete(id);
    await this.persist();
  }

  private async load(): Promise<void> {
    if (this.initialized) {
      return;
    }
    try {
      const data = await readFile(this.filePath, "utf-8");
      const missions: Mission[] = JSON.parse(data);
      this.memory.seed(missions);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
    this.initialized = true;
  }

  private async persist(): Promise<void> {
    if (this.saving) {
      this.pendingSave = true;
      return;
    }
    this.saving = true;
    try {
      await mkdir(dirname(this.filePath), { recursive: true });
      const missions = await this.memory.findAll();
      await writeFile(this.filePath, JSON.stringify(missions, null, 2));
    } finally {
      this.saving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        await this.persist();
      }
    }
  }
}
