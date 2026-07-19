-- MiLO_Core Milestone 3: Real Data & Sync schema
-- Date: 2026-07-17

-- Connected accounts (OAuth tokens)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'isds')),
  service TEXT NOT NULL CHECK (service IN ('gmail', 'calendar', 'drive', 'isds_inbox')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, service)
);

-- Synced emails
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  gmail_id TEXT NOT NULL,
  thread_id TEXT,
  subject TEXT,
  from_address TEXT,
  to_addresses TEXT[],
  body_text TEXT,
  body_html TEXT,
  snippet TEXT,
  labels TEXT[],
  is_read BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, gmail_id)
);

-- Synced calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  google_event_id TEXT NOT NULL,
  summary TEXT,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  attendees TEXT[],
  status TEXT DEFAULT 'confirmed',
  calendar_id TEXT,
  color TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, google_event_id)
);

-- Synced Drive files
CREATE TABLE IF NOT EXISTS drive_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  google_file_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  web_view_link TEXT,
  modified_at TIMESTAMPTZ,
  parent_folder TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, google_file_id)
);

-- Obsidian notes
CREATE TABLE IF NOT EXISTS obsidian_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  title TEXT,
  content TEXT,
  tags TEXT[],
  modified_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, file_path)
);

-- Knowledge chunks (for embeddings/RAG)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('email', 'document', 'note', 'drive_file', 'calendar_event')),
  source_id UUID NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  -- pgvector embedding column (enable via: CREATE EXTENSION IF NOT EXISTS vector;)
  -- embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Morning briefings
CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  content TEXT NOT NULL,
  version TEXT DEFAULT '2.0',
  summary TEXT,
  blocker_count INTEGER DEFAULT 0,
  section_count INTEGER DEFAULT 0
);

-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources JSONB,
  suggested_actions JSONB,
  mission_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_drive_files_user_id ON drive_files(user_id);
CREATE INDEX IF NOT EXISTS idx_obsidian_notes_user_id ON obsidian_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_user_id ON knowledge_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON knowledge_chunks(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_briefings_user_id ON briefings(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(conversation_id, created_at);

-- Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE obsidian_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY "Users can manage their own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own emails" ON emails FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own calendar events" ON calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own drive files" ON drive_files FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own obsidian notes" ON obsidian_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own knowledge chunks" ON knowledge_chunks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own briefings" ON briefings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own chat conversations" ON chat_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own chat messages" ON chat_messages FOR ALL USING (auth.uid() = user_id);
