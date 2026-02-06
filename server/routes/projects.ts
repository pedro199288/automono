import { getAllProjects, createProject, deleteProject } from "../db/queries";

export async function handleProjectRoutes(req: Request, url: URL): Promise<Response | null> {
  // List all projects
  if (url.pathname === "/api/projects" && req.method === "GET") {
    const projectsList = getAllProjects();
    return Response.json({ projects: projectsList });
  }

  // Create new project
  if (url.pathname === "/api/projects" && req.method === "POST") {
    const body = await req.json();
    const { name } = body as { name: string };
    if (!name?.trim()) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }
    const project = createProject(name.trim());
    return Response.json({ project });
  }

  // Delete project
  const deleteMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (deleteMatch && req.method === "DELETE") {
    const id = deleteMatch[1];
    deleteProject(id);
    return Response.json({ ok: true });
  }

  return null;
}
