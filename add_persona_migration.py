"""Add analysis_metadata and persona tables

Run this migration with:
cd /Users/mohammadfaisal/Documents/coach-sidekick/coach-sidekick-backend
poetry run alembic revision --autogenerate -m "Add analysis_metadata and persona tables"
poetry run alembic upgrade head

Or use this SQL directly in your database:
"""

migration_sql = """
-- Add analysis_metadata column to analyses table if it doesn't exist
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS analysis_metadata JSONB DEFAULT '{}';

-- Create client_personas table
CREATE TABLE IF NOT EXISTS client_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
    age_range VARCHAR(50),
    occupation VARCHAR(255),
    location VARCHAR(255),
    family_situation TEXT,
    primary_goals JSONB DEFAULT '[]',
    short_term_goals JSONB DEFAULT '[]',
    long_term_goals JSONB DEFAULT '[]',
    main_challenges JSONB DEFAULT '[]',
    obstacles JSONB DEFAULT '[]',
    fears JSONB DEFAULT '[]',
    communication_style VARCHAR(100),
    learning_style VARCHAR(100),
    personality_traits JSONB DEFAULT '[]',
    values JSONB DEFAULT '[]',
    strengths JSONB DEFAULT '[]',
    growth_areas JSONB DEFAULT '[]',
    recurring_themes JSONB DEFAULT '[]',
    triggers JSONB DEFAULT '[]',
    achievements JSONB DEFAULT '[]',
    breakthrough_moments JSONB DEFAULT '[]',
    sessions_analyzed INTEGER DEFAULT 0,
    confidence_score FLOAT DEFAULT 0.0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create persona_updates table
CREATE TABLE IF NOT EXISTS persona_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES client_personas(id) ON DELETE CASCADE,
    session_id UUID REFERENCES coaching_sessions(id),
    field_name VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    confidence FLOAT DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_personas_client_id ON client_personas(client_id);
CREATE INDEX IF NOT EXISTS idx_persona_updates_persona_id ON persona_updates(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_updates_session_id ON persona_updates(session_id);
"""

print("Migration SQL:")
print(migration_sql)
print("\n" + "="*50)
print("To apply this migration:")
print("1. Connect to your database")
print("2. Run the SQL above")
print("\nOR")
print("\n1. Go to backend directory:")
print("   cd /Users/mohammadfaisal/Documents/coach-sidekick/coach-sidekick-backend")
print("2. Generate migration:")
print("   poetry run alembic revision --autogenerate -m 'Add persona tables'")
print("3. Apply migration:")
print("   poetry run alembic upgrade head")