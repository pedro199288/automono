import { getAuthUrl, handleAuthCallback, isAuthenticated } from "../services/drive";

const SPA_ORIGIN = process.env.NODE_ENV === "production" ? "" : "http://localhost:5173";

export async function handleAuthRoutes(req: Request, url: URL): Promise<Response | null> {
  if (url.pathname === "/api/auth/status") {
    return Response.json({ authenticated: isAuthenticated() });
  }

  if (url.pathname === "/api/auth/login") {
    try {
      const authUrl = getAuthUrl();
      return Response.json({ url: authUrl });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 400 });
    }
  }

  if (url.pathname === "/api/auth/callback") {
    const code = url.searchParams.get("code");
    if (!code) {
      return Response.json({ error: "No code provided" }, { status: 400 });
    }
    try {
      await handleAuthCallback(code);
      // Redirect back to settings page
      return new Response(null, {
        status: 302,
        headers: { Location: `${SPA_ORIGIN}/settings?auth=success` },
      });
    } catch (e: any) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${SPA_ORIGIN}/settings?auth=error&message=${encodeURIComponent(e.message)}` },
      });
    }
  }

  return null;
}
