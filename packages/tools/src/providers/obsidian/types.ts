export interface ObsidianNote {
  id: string;
  title: string;
  path: string;
  content: string;
  modifiedAt: Date;
  tags: string[];
}

export interface ListNotesOptions {
  maxResults?: number;
}
