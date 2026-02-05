import { handleRequest } from "./router";
import "./db";
import { join } from "path";
import { existsSync } from "fs";

const PORT = 3001;

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // API routes
    if (url.pathname.startsWith("/api/")) {
      return handleRequest(req);
    }

    // In production, serve static files
    if (process.env.NODE_ENV === "production") {
      const buildPath = join(import.meta.dir, "../build/client");
      const filePath = join(buildPath, url.pathname);

      if (existsSync(filePath) && !filePath.endsWith("/")) {
        return new Response(Bun.file(filePath));
      }

      // SPA fallback
      return new Response(Bun.file(join(buildPath, "index.html")));
    }

    return new Response("API server running. SPA is served by Vite dev server.", {
      status: 200,
    });
  },
});

console.log(`API server running on http://localhost:${PORT}`);
