import { google } from "googleapis";
import { getAuthTokens, saveAuthTokens, getSetting } from "../db/queries";

function getOAuth2Client() {
  const clientId = getSetting("google_client_id");
  const clientSecret = getSetting("google_client_secret");
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, "http://localhost:3001/api/auth/callback");

  const tokens = getAuthTokens();
  if (tokens) {
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: new Date(tokens.expiry).getTime(),
    });

    oauth2Client.on("tokens", (newTokens) => {
      saveAuthTokens(
        newTokens.access_token ?? tokens.access_token,
        newTokens.refresh_token ?? tokens.refresh_token,
        newTokens.expiry_date ? new Date(newTokens.expiry_date).toISOString() : tokens.expiry
      );
    });
  }

  return oauth2Client;
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/drive.readonly"],
  });
}

export async function handleAuthCallback(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  saveAuthTokens(
    tokens.access_token!,
    tokens.refresh_token!,
    tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : new Date(Date.now() + 3600000).toISOString()
  );
  return tokens;
}

export function isAuthenticated(): boolean {
  const tokens = getAuthTokens();
  return tokens !== null;
}

function getDrive() {
  const auth = getOAuth2Client();
  return google.drive({ version: "v3", auth });
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

export async function listFolder(folderId: string): Promise<DriveFile[]> {
  const drive = getDrive();
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, parents)",
      pageSize: 100,
      pageToken,
    });
    if (res.data.files) {
      files.push(
        ...res.data.files.map((f) => ({
          id: f.id!,
          name: f.name!,
          mimeType: f.mimeType!,
          parents: f.parents as string[] | undefined,
        }))
      );
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files.sort((a, b) => a.name.localeCompare(b.name));
}

export async function downloadFile(fileId: string): Promise<Buffer> {
  const drive = getDrive();
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "arraybuffer" });
  return Buffer.from(res.data as ArrayBuffer);
}

export async function getFileName(fileId: string): Promise<string> {
  const drive = getDrive();
  const res = await drive.files.get({ fileId, fields: "name" });
  return res.data.name!;
}
