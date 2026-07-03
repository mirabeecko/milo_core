import { google, drive_v3 } from "googleapis";
import { DriveFile, ListDriveFilesOptions } from "./types.js";

export interface DriveClientConfig {
  accessToken: string;
  refreshToken?: string;
}

export class DriveClient {
  private drive;

  constructor(config: DriveClientConfig) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });

    this.drive = google.drive({ version: "v3", auth });
  }

  async listFiles(options: ListDriveFilesOptions = {}): Promise<DriveFile[]> {
    const response = await this.drive.files.list({
      pageSize: options.maxResults ?? 20,
      q: options.query ?? "trashed = false",
      fields: "files(id, name, mimeType, webViewLink, modifiedTime, size, owners(displayName, emailAddress))",
      orderBy: "modifiedTime desc",
    });

    const files = response.data.files ?? [];
    return files.map((file) => this.parseFile(file));
  }

  private parseFile(file: drive_v3.Schema$File): DriveFile {
    return {
      id: file.id ?? "",
      name: file.name ?? "(Bez názvu)",
      mimeType: file.mimeType ?? "application/octet-stream",
      webViewLink: file.webViewLink ?? null,
      modifiedAt: file.modifiedTime ? new Date(file.modifiedTime) : new Date(),
      size: file.size ? parseInt(file.size, 10) : null,
      owners: (file.owners ?? []).map((owner) => owner.displayName ?? owner.emailAddress ?? "").filter(Boolean),
      isFolder: file.mimeType === "application/vnd.google-apps.folder",
    };
  }
}
