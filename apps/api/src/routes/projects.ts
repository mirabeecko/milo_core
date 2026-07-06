import { FastifyInstance } from "fastify";
import { getProjects, createProject, deleteProject } from "../modules/projects/service.js";
import { getUsageForProject } from "../modules/projects/usage.js";
import { scanProjects } from "../modules/projects/scan.js";

export async function projectsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/", async () => {
    return await getProjects();
  });

  fastify.get("/:id", async (request) => {
    const { id } = request.params;
    const projects = await getProjects();
    const project = projects.find((p) => p.id === id);
    
    if (!project) {
      return { error: "Project not found" }, 404;
    }

    return project;
  });

  fastify.post("/", async (request) => {
    const { name, description, priority } = request.body;
    const project = await createProject({ name, description, priority });
    return project;
  });

  fastify.delete("/:id", async (request) => {
    const { id } = request.params;
    await deleteProject(id);
    return { message: "Project deleted" };
  });

  fastify.get("/:id/usage", async (request) => {
    const { id } = request.params;
    const usage = await getUsageForProject(id);
    return usage;
  });
}
