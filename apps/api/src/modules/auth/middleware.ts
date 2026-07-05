import { FastifyRequest, FastifyReply, RouteGenericInterface } from "fastify";
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
): Promise<void> {
  const authHeader = request.headers.authorization;
  const queryToken = (request.query as { token?: string } | undefined)?.token;

  let accessToken: string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    accessToken = authHeader.slice(7);
  } else if (queryToken) {
    accessToken = queryToken;
  }

  if (!accessToken) {
    return reply.status(401).send({ error: "Unauthorized", message: "Chybí autentizační token" });
  }

  try {
    const user = await authService.getUser(accessToken);

    if (!user) {
      return reply.status(401).send({ error: "Unauthorized", message: "Neplatný nebo vypršený token" });
    }

    request.user = user;
  } catch (error) {
    request.log.error(error);
    return reply.status(401).send({ error: "Unauthorized", message: "Chyba při ověření tokenu" });
  }
}
