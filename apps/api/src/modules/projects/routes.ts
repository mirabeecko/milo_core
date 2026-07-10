import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getProjects, getProject, createProject, updateProject, deleteProject } from "./service.js";
import { scanProjects } from "./scan.js";
import { getBreadcrumbs } from "@milo/agents";
import type { Project } from "./service.js";

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["critical", "important", "normal", "low"]).optional(),
  status: z.enum(["active", "on_hold", "completed", "archived"]).optional(),
});

const updateProjectSchema = z.object({
  goal: z.string().optional(),
  status: z.enum(["in_progress", "paused", "done", "active", "on_hold", "completed", "archived"]).optional(),
  done_summary: z.string().optional(),
  remaining_summary: z.string().optional(),
  time_spent_hours: z.number().optional(),
  time_estimate_hours: z.number().optional(),
  cost_spent: z.number().optional(),
  cost_estimate: z.number().optional(),
  description: z.string().optional(),
  priority: z.enum(["critical", "important", "normal", "low"]).optional(),
});

export async function projectsRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get(
    "/",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        const projects = getProjects();
        return reply.send(projects);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch projects" });
      }
    },
  );

  app.get(
    "/last-activity",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const query = request.query as { limit?: string };
      const limit = query.limit ? parseInt(query.limit, 10) : 10;
      const breadcrumbs = getBreadcrumbs();
      return reply.send({
        breadcrumbs: breadcrumbs.slice(0, Math.min(limit, 50)),
        total: breadcrumbs.length,
      });
    },
  );

  app.get(
    "/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const project = getProject(id);
        if (!project) {
          return reply.status(404).send({ error: "Project not found" });
        }
        return reply.send(project);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch project" });
      }
    },
  );

  app.post(
    "/",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = createProjectSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      try {
        const project = await createProject(parsed.data as Omit<Project, "id">);
        return reply.status(201).send(project);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to create project" });
      }
    },
  );

  app.patch(
    "/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const parsed = updateProjectSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      try {
        const project = await updateProject(id, parsed.data);
        if (!project) {
          return reply.status(404).send({ error: "Project not found" });
        }
        return reply.send(project);
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to update project" });
      }
    },
  );

  app.delete(
    "/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      try {
        await deleteProject(id);
        return reply.send({ message: "Project deleted" });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to delete project" });
      }
    },
  );

  app.post(
    "/scan",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        const results = await scanProjects();
        return reply.send({ message: `Scanned ${results.length} projects`, results });
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to scan projects" });
      }
    },
  );

  app.get(
    "/:id/breadcrumbs",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const proj = getProject(id);
      if (!proj) return reply.status(404).send({ error: "Project not found" });
      const breadcrumbs = getBreadcrumbs(proj.name);
      return reply.send({ project: proj.name, breadcrumbs });
    },
  );
}
