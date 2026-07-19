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
    // Development fallback — demo user bez tokenu
    if (process.env.NODE_ENV !== "production") {
      request.user = { id: "demo-user", email: "demo@milo.local", name: "Demo User", avatarUrl: null };
      return;
    }
    return reply.status(401).send({
      error: "Unauthorized",
      code: "MISSING_TOKEN",
      message: "Chybí autentizační token",
    });
  }

  if (authService.isTokenExpired(accessToken)) {
    return reply.status(401).send({
      error: "Unauthorized",
      code: "TOKEN_EXPIRED",
      message: "Token vypršel, je potřeba obnovit",
      canRefresh: true,
    });
  }

  try {
    const result = await authService.getUserWithExpiry(accessToken);

    if (!result) {
      return reply.status(401).send({
        error: "Unauthorized",
        code: "INVALID_TOKEN",
        message: "Neplatný nebo vypršený token",
      });
    }

    request.user = result.user;
  } catch (error) {
    request.log.error(error);
    return reply.status(401).send({
      error: "Unauthorized",
      code: "AUTH_ERROR",
      message: "Chyba při ověření tokenu",
    });
  }
}
