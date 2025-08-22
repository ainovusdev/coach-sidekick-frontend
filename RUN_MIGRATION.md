# Database Migration Required: Coaching Preference Feature

## Quick Migration Steps

### 1. Open Supabase SQL Editor
Go to: https://ugimyhpqoerloopagwij.supabase.co/project/ugimyhpqoerloopagwij/editor

### 2. Run This SQL
```sql
-- Add coaching_preference column to profiles table
ALTER TABLE profiles 
ADD COLUMN coaching_preference TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN profiles.coaching_preference IS 'User coaching style and preferences for AI analysis customization';
```

### 3. Verify Success
Run this to confirm:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'coaching_preference';
```

You should see one row returned.

## What This Enables
- Settings page with coaching preference input
- Personalized AI suggestions based on your coaching style
- Preferences persist across all sessions

## Test the Feature
1. Go to dashboard
2. Click "Settings" button
3. Enter your coaching preferences
4. Save and start a session to see personalized suggestions

That's it! The feature is now ready to use.