-- Add coaching_preference column to profiles table
ALTER TABLE profiles 
ADD COLUMN coaching_preference TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN profiles.coaching_preference IS 'User coaching style and preferences for AI analysis customization';