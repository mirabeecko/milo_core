export interface XPost {
  id: string;
  text: string;
  createdAt: string;
  authorId?: string;
  mediaIds?: string[];
  /** ID of post this is replying to */
  inReplyToId?: string;
  /** ID of post this is quoting */
  quotePostId?: string;
}

export interface XPostResult {
  data: {
    id: string;
    text: string;
  };
}

export interface XUser {
  id: string;
  username: string;
  name: string;
}

export interface XSearchResult {
  data: Array<{
    id: string;
    text: string;
    author_id?: string;
    created_at?: string;
    public_metrics?: {
      retweet_count: number;
      reply_count: number;
      like_count: number;
      quote_count: number;
      bookmark_count: number;
      impression_count: number;
    };
  }>;
  meta?: {
    result_count: number;
    next_token?: string;
  };
}

export interface SpokespersonAgentState {
  publishedPosts: XPost[];
  scheduledPosts: Array<{ text: string; scheduledFor: string }>;
  lastSearchQuery?: string;
  lastSearchResults?: XSearchResult;
  taskProgress: number;
  isConfigured: boolean;
}
