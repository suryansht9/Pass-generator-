-- SQL Schema for Supabase PostgreSQL deployment
-- Code for Community Hackathon (CMP × GDG)

-- 1. Participants Table
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  college_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  verification_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' or 'REVOKED'
  checked_in BOOLEAN NOT NULL DEFAULT FALSE,
  food_pass_generated BOOLEAN NOT NULL DEFAULT FALSE,
  food_pass_id TEXT UNIQUE,
  food_received BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_id ON public.participants (participant_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON public.participants (status);
CREATE INDEX IF NOT EXISTS idx_participants_token ON public.participants (verification_token);

-- 2. Access Codes Table
CREATE TABLE IF NOT EXISTS public.access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'USED', 'REVOKED'
  used_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_access_codes_code ON public.access_codes (code);

-- 3. Whitelist Participants Table (200 Selected Participants)
CREATE TABLE IF NOT EXISTS public.whitelist_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  college_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  access_code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CLAIMED', 'REVOKED'
  claimed_at TIMESTAMP WITH TIME ZONE,
  participant_id TEXT UNIQUE,
  checked_in BOOLEAN NOT NULL DEFAULT FALSE,
  food_pass_generated BOOLEAN NOT NULL DEFAULT FALSE,
  food_pass_id TEXT UNIQUE,
  food_received BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whitelist_full_name ON public.whitelist_participants (full_name);
CREATE INDEX IF NOT EXISTS idx_whitelist_access_code ON public.whitelist_participants (access_code);
CREATE INDEX IF NOT EXISTS idx_whitelist_email ON public.whitelist_participants (email);

-- Enable RLS if using Supabase client directly
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelist_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public verification read" ON public.participants FOR SELECT USING (true);
