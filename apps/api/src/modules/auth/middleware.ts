import { FastifyRequest, FastifyReply, HookHandlerDoneFunction, RouteGenericInterface } from "fastify";
import { AuthService } from "./service.js";

export interface AuthenticatedRequest<T extends RouteGenericInterface = RouteGenericInterface> extends FastifyRequest<T> {
  user?: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

const authService = new AuthService();

export async function authMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const accessToken = authHeader.slice(7);

  try {
    const user = await authService.getUser(accessToken);

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    request.user = user;
    done();
  } catch (error) {
    request.log.error(error);
    return reply.status(401).send({ error: "Unauthorized" });
  }
}
