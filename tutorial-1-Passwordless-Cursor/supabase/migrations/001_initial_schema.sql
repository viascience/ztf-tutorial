-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keycloak_sub TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create todos table
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  category TEXT DEFAULT 'general',
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_created_at ON todos(created_at DESC);

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for todos table
-- Note: For this demo, we're using user_id directly since we're using service role
-- In production with Supabase Auth, you'd use auth.uid()

-- Users can view their own todos
CREATE POLICY "Users can view own todos"
  ON todos FOR SELECT
  USING (true);  -- Service role will filter by user_id in queries

-- Users can create their own todos
CREATE POLICY "Users can create own todos"
  ON todos FOR INSERT
  WITH CHECK (true);  -- Service role will set user_id in queries

-- Users can update their own todos
CREATE POLICY "Users can update own todos"
  ON todos FOR UPDATE
  USING (true);  -- Service role will filter by user_id in queries

-- Users can delete their own todos
CREATE POLICY "Users can delete own todos"
  ON todos FOR DELETE
  USING (true);  -- Service role will filter by user_id in queries

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to todos table
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



