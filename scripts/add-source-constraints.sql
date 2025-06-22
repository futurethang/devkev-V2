-- Add unique constraints to prevent duplicate sources
-- This ensures we can't have multiple sources with the same URL

-- Add unique constraint on URL
ALTER TABLE sources 
ADD CONSTRAINT unique_source_url UNIQUE (url);

-- Add unique constraint on name as well (optional but recommended)
ALTER TABLE sources 
ADD CONSTRAINT unique_source_name UNIQUE (name);

-- Add constraint to prevent duplicate articles from same source
-- This should already exist, but let's make sure
ALTER TABLE feed_items
DROP CONSTRAINT IF EXISTS feed_items_source_id_guid_key;

ALTER TABLE feed_items
ADD CONSTRAINT feed_items_source_id_guid_key UNIQUE (source_id, guid);

-- Add index on URL for faster duplicate detection
CREATE INDEX IF NOT EXISTS idx_feed_items_url ON feed_items(url);

-- View current constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    tc.constraint_type
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('sources', 'feed_items')
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY tc.table_name, tc.constraint_name;