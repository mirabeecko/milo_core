// Vercel serverless wrapper for MiLO API
import { createServer } from "http";
import { parse } from "url";

// Dynamic import Fastify app
let appPromise;

async function getApp() {
  if (!appPromise) {
    const { default: buildApp } = await import("../src/server-build.js");
    appPromise = buildApp();
  }
  return appPromise;
}

export default async function handler(req, res) {
  const app = await getApp();
  await app.ready();
  app.server.emit("request", req, res);
}
