-- Create session_insights table to store AI-generated insights after session completion
CREATE TABLE IF NOT EXISTS public.session_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.coaching_sessions(id) ON DELETE CASCADE,
  bot_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  
  -- Transcript metadata
  transcript_duration_minutes INTEGER,
  total_word_count INTEGER,
  speaker_word_counts JSONB DEFAULT '{}',
  
  -- Overall session performance metrics
  overall_score DECIMAL(3,1) CHECK (overall_score >= 0 AND overall_score <= 10),
  conversation_phase TEXT CHECK (conversation_phase IN ('opening', 'exploration', 'insight', 'commitment', 'closing')),
  coach_energy_level DECIMAL(3,1) CHECK (coach_energy_level >= 0 AND coach_energy_level <= 10),
  client_engagement_level DECIMAL(3,1) CHECK (client_engagement_level >= 0 AND client_engagement_level <= 10),
  
  -- Coaching criteria scores (12 criteria)
  criteria_scores JSONB DEFAULT '{}',
  
  -- GO LIVE values alignment scores
  go_live_alignment JSONB DEFAULT '{}',
  
  -- Key insights and patterns
  key_insights TEXT[],
  patterns_detected TEXT[],
  breakthrough_moments TEXT[],
  resistance_patterns TEXT[],
  
  -- Action items and commitments
  client_commitments TEXT[],
  suggested_followups TEXT[],
  homework_assignments TEXT[],
  
  -- Coaching effectiveness analysis
  most_effective_interventions TEXT[],
  missed_opportunities TEXT[],
  coaching_strengths TEXT[],
  areas_for_improvement TEXT[],
  
  -- Session summary
  executive_summary TEXT,
  session_theme TEXT,
  key_topics_discussed TEXT[],
  emotional_journey TEXT,
  
  -- Progress tracking (for returning clients)
  progress_since_last_session TEXT,
  recurring_themes TEXT[],
  evolution_of_challenges TEXT,
  
  -- Recommendations
  recommended_resources TEXT[],
  suggested_tools TEXT[],
  next_session_focus TEXT,
  
  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generation_model TEXT DEFAULT 'gpt-4o',
  analysis_version TEXT DEFAULT '1.0',
  raw_analysis_data JSONB,
  
  -- Indexes for performance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_session_insights_session_id ON public.session_insights(session_id);
CREATE INDEX idx_session_insights_bot_id ON public.session_insights(bot_id);
CREATE INDEX idx_session_insights_user_id ON public.session_insights(user_id);
CREATE INDEX idx_session_insights_client_id ON public.session_insights(client_id);
CREATE INDEX idx_session_insights_generated_at ON public.session_insights(generated_at DESC);
CREATE INDEX idx_session_insights_overall_score ON public.session_insights(overall_score DESC);

-- Add RLS policies
ALTER TABLE public.session_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own session insights
CREATE POLICY "Users can view own session insights" ON public.session_insights
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own session insights
CREATE POLICY "Users can insert own session insights" ON public.session_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own session insights
CREATE POLICY "Users can update own session insights" ON public.session_insights
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own session insights
CREATE POLICY "Users can delete own session insights" ON public.session_insights
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_insights_updated_at
  BEFORE UPDATE ON public.session_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment on table
COMMENT ON TABLE public.session_insights IS 'Stores AI-generated insights and analysis for completed coaching sessions';