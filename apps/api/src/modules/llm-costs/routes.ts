import { FastifyInstance } from "fastify";
import { getLlmCostsSummary, type LlmCostPeriod } from "./service.js";

const PERIODS: LlmCostPeriod[] = ["day", "week", "month", "year"];

export async function llmCostsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get<{ Querystring: { period?: string } }>("/summary", async (request, reply) => {
    const period = (request.query.period ?? "day") as LlmCostPeriod;
    if (!PERIODS.includes(period)) {
      return reply.status(400).send({ error: `Invalid period. Use one of: ${PERIODS.join(", ")}` });
    }
    return await getLlmCostsSummary(period);
  });
}
