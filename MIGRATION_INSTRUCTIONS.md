# 🚀 Client Management Migration Instructions

## Quick Start

**The error you're seeing means the database tables haven't been created yet. Here's how to fix it:**

### Step 1: Go to Supabase Dashboard
1. Open https://supabase.com/dashboard
2. Go to your project: `ugimyhpqoerloopagwij`
3. Navigate to **SQL Editor** in the sidebar

### Step 2: Copy and Paste This SQL

**Copy the entire SQL block below and paste it into the Supabase SQL Editor, then click "Run":**

```sql
-- Migration: Add Client Management Tables
-- Description: Creates clients table and updates existing tables for client relationship
-- Date: 2025-07-22

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  position VARCHAR(255),
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_client_email_per_coach UNIQUE (coach_id, email)
);

-- Add client_id to coaching_sessions table
ALTER TABLE coaching_sessions 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Add client context to coaching_analyses for personalized insights
ALTER TABLE coaching_analyses 
ADD COLUMN IF NOT EXISTS client_context JSONB DEFAULT '{}'::jsonb;

-- Create client session statistics table for performance optimization
CREATE TABLE IF NOT EXISTS client_session_stats (
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE PRIMARY KEY,
  total_sessions INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  last_session_date TIMESTAMPTZ,
  average_engagement_score DECIMAL(5,2),
  average_overall_score DECIMAL(5,2),
  improvement_trends JSONB DEFAULT '{}'::jsonb,
  coaching_focus_areas JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_coach_id ON clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_client_id ON coaching_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_session_stats_last_session ON client_session_stats(last_session_date);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_session_stats_updated_at BEFORE UPDATE ON client_session_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update client session stats
CREATE OR REPLACE FUNCTION update_client_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if client_id is set
    IF NEW.client_id IS NOT NULL THEN
        INSERT INTO client_session_stats (client_id, total_sessions, updated_at)
        VALUES (NEW.client_id, 1, NOW())
        ON CONFLICT (client_id) DO UPDATE SET
            total_sessions = client_session_stats.total_sessions + 1,
            last_session_date = NOW(),
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when coaching session is created
CREATE TRIGGER update_client_stats_on_session_create 
    AFTER INSERT ON coaching_sessions
    FOR EACH ROW EXECUTE FUNCTION update_client_session_stats();

-- Function to update client stats when session is completed
CREATE OR REPLACE FUNCTION update_client_session_completion_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if session has client_id and summary data
    IF NEW.coaching_session_id IN (
        SELECT id FROM coaching_sessions WHERE client_id IS NOT NULL
    ) THEN
        UPDATE client_session_stats 
        SET 
            total_duration_minutes = COALESCE(total_duration_minutes, 0) + COALESCE(NEW.duration_minutes, 0),
            average_overall_score = (
                SELECT AVG(ms.final_overall_score)
                FROM meeting_summaries ms
                JOIN coaching_sessions cs ON cs.id = ms.coaching_session_id
                WHERE cs.client_id = (
                    SELECT client_id FROM coaching_sessions WHERE id = NEW.coaching_session_id
                )
                AND ms.final_overall_score IS NOT NULL
            ),
            updated_at = NOW()
        WHERE client_id = (
            SELECT client_id FROM coaching_sessions WHERE id = NEW.coaching_session_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update client stats when meeting summary is created
CREATE TRIGGER update_client_stats_on_summary_create 
    AFTER INSERT ON meeting_summaries
    FOR EACH ROW EXECUTE FUNCTION update_client_session_completion_stats();

-- Add Row Level Security (RLS) policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_session_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own clients
CREATE POLICY "Users can view their own clients" ON clients
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Users can insert their own clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Users can update their own clients" ON clients
    FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Users can delete their own clients" ON clients
    FOR DELETE USING (auth.uid() = coach_id);

-- RLS Policy: Users can only see stats for their own clients
CREATE POLICY "Users can view their own client stats" ON client_session_stats
    FOR SELECT USING (
        client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
    );

-- Update existing coaching_sessions RLS to include client access
-- Note: This assumes coaching_sessions already has RLS enabled
DROP POLICY IF EXISTS "Users can view sessions with client access" ON coaching_sessions;
CREATE POLICY "Users can view sessions with client access" ON coaching_sessions
    FOR SELECT USING (
        auth.uid() = user_id OR 
        client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
    );

COMMENT ON TABLE clients IS 'Stores client information for coaches';
COMMENT ON TABLE client_session_stats IS 'Aggregated statistics for client coaching sessions';
COMMENT ON COLUMN clients.tags IS 'JSON array of tags for client categorization';
COMMENT ON COLUMN clients.status IS 'Client status: active, inactive, or archived';
COMMENT ON COLUMN client_session_stats.improvement_trends IS 'JSON object tracking improvement metrics over time';
COMMENT ON COLUMN client_session_stats.coaching_focus_areas IS 'JSON array of identified coaching focus areas';
```

### Step 3: Verify Migration Success

After running the SQL, you should see a success message. Then:

1. Go back to your app: http://localhost:3003
2. Click "Manage Clients" 
3. The error should be gone!

### Step 4: Test the Features

1. **Add a Client**: Click "Add New Client" and create your first coaching client
2. **Create a Meeting**: Go back to the dashboard and create a meeting - you'll see the client selector
3. **View Client Details**: Check out the client statistics and session history

## 🎉 What This Migration Creates

- ✅ **`clients`** table - Store coaching client information  
- ✅ **`client_session_stats`** table - Track client progress over time
- ✅ **Enhanced `coaching_sessions`** - Link meetings to clients
- ✅ **Row Level Security** - Coaches only see their own clients
- ✅ **Automatic Triggers** - Statistics update automatically
- ✅ **Performance Indexes** - Fast queries and searches

## 🚨 If You Get Errors

**"relation already exists"** → This is normal, ignore it and continue

**"permission denied"** → Make sure you're logged into the right Supabase project

**Other errors** → Copy the error message and let me know!

---

**Once the migration is complete, your client management system will be fully functional! 🎯**