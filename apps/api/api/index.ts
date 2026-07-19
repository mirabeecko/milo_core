// Vercel serverless handler for MiLO API
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Import the built Fastify app
let appInstance: any = null;
let initPromise: Promise<any> | null = null;

async function getApp() {
  if (appInstance) return appInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Dynamically import the server module
    const { buildApp } = await import("../dist/server-build.js");
    appInstance = await buildApp();
    await appInstance.ready();
    return appInstance;
  })();

  return initPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  await app.ready();
  app.server.emit("request", req, res);
}
