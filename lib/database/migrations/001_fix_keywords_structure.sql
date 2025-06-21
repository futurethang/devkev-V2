-- Migration to fix keywords structure in focus_profiles table
-- Changes keywords from TEXT[] to JSONB to support structured keyword configuration

-- Step 1: Add new column for structured keywords
ALTER TABLE focus_profiles 
ADD COLUMN keywords_jsonb JSONB DEFAULT '{"boost": {"high": [], "medium": [], "low": []}, "filter": {"exclude": [], "require": []}}';

-- Step 2: Migrate existing data (if any) - assuming keywords array contains all keywords as medium boost
UPDATE focus_profiles 
SET keywords_jsonb = jsonb_build_object(
  'boost', jsonb_build_object(
    'high', '[]'::jsonb,
    'medium', to_jsonb(COALESCE(keywords, ARRAY[]::text[])),
    'low', '[]'::jsonb
  ),
  'filter', jsonb_build_object(
    'exclude', '[]'::jsonb,
    'require', '[]'::jsonb
  )
)
WHERE keywords IS NOT NULL AND array_length(keywords, 1) > 0;

-- Step 3: Drop the old column
ALTER TABLE focus_profiles DROP COLUMN keywords;

-- Step 4: Rename the new column
ALTER TABLE focus_profiles RENAME COLUMN keywords_jsonb TO keywords;

-- Step 5: Update the v_active_profiles view
DROP VIEW IF EXISTS v_active_profiles;
CREATE VIEW v_active_profiles AS
SELECT * FROM focus_profiles WHERE enabled = true;

-- Step 6: Update any existing profiles with proper keyword structure
-- This ensures the default profiles have the correct structure
UPDATE focus_profiles
SET keywords = '{
  "boost": {
    "high": ["ai", "machine learning", "product"],
    "medium": ["startup", "tools", "automation"],
    "low": ["technology", "development"]
  },
  "filter": {
    "exclude": ["spam", "advertisement"],
    "require": []
  }
}'::jsonb
WHERE id = 'ai-product' AND name = 'AI Product Builder';

UPDATE focus_profiles
SET keywords = '{
  "boost": {
    "high": ["ml", "pytorch", "tensorflow", "mlops"],
    "medium": ["data", "neural networks", "deep learning"],
    "low": ["python", "jupyter", "models"]
  },
  "filter": {
    "exclude": ["spam", "advertisement"],
    "require": []
  }
}'::jsonb
WHERE id = 'ml-engineering' AND name = 'ML Engineering';

UPDATE focus_profiles
SET keywords = '{
  "boost": {
    "high": ["design system", "component library", "ui"],
    "medium": ["react", "typescript", "css"],
    "low": ["frontend", "web", "interface"]
  },
  "filter": {
    "exclude": ["spam", "advertisement"],
    "require": []
  }
}'::jsonb
WHERE id = 'design-systems' AND name = 'Design Systems & Frontend';