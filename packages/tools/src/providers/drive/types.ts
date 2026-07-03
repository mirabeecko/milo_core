export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string | null;
  modifiedAt: Date;
  size: number | null;
  owners: string[];
  isFolder: boolean;
}

export interface ListDriveFilesOptions {
  maxResults?: number;
  query?: string;
}
