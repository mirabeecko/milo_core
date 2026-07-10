import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import {
  getPendingReviews,
  getReview,
  approveReview,
  rejectReview,
  getTodayDigest,
  markDigestSent,
} from "../../services/reviews.js";

export async function reviewsRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get(
    "/",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      const reviews = getPendingReviews();
      return reply.send({ reviews });
    },
  );

  app.get(
    "/digest",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      const digest = getTodayDigest();
      return reply.send(digest);
    },
  );

  app.post(
    "/digest/sent",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      markDigestSent();
      return reply.send({ success: true });
    },
  );

  app.get(
    "/:id",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const review = getReview(id);
      if (!review) return reply.status(404).send({ error: "Review not found" });
      return reply.send(review);
    },
  );

  app.post(
    "/:id/approve",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const review = approveReview(id);
      if (!review) return reply.status(404).send({ error: "Review not found" });
      return reply.send(review);
    },
  );

  app.post(
    "/:id/reject",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const review = rejectReview(id);
      if (!review) return reply.status(404).send({ error: "Review not found" });
      return reply.send(review);
    },
  );
}
