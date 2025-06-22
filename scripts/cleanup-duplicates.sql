-- Clean up duplicate sources, keeping the properly named ones
-- and removing timestamp-based duplicates

-- First, let's see what we have
SELECT id, name, type, url, created_at 
FROM sources 
WHERE name IN ('Vercel Blog', 'GitHub Trending TypeScript', 'HackerNews AI Stories')
ORDER BY name, created_at;

-- Delete duplicate Vercel Blog sources (keep the one with proper ID)
DELETE FROM sources 
WHERE name = 'Vercel Blog' 
AND id LIKE 'rss-%';

-- Delete duplicate GitHub Trending TypeScript sources  
DELETE FROM sources 
WHERE name = 'GitHub Trending TypeScript' 
AND id LIKE 'github-%';

-- Delete duplicate HackerNews AI Stories sources (keep the properly configured ones)
DELETE FROM sources 
WHERE name = 'HackerNews AI Stories' 
AND id LIKE 'hn-%';

-- Clean up duplicate articles - keep the oldest one for each URL
DELETE FROM feed_items 
WHERE id NOT IN (
    SELECT DISTINCT ON (url) id 
    FROM feed_items 
    ORDER BY url, created_at ASC
);

-- Update any profile references to use the correct source IDs
-- This might be needed if profiles reference the deleted source IDs

-- Show final source list
SELECT id, name, type, enabled, fetch_interval 
FROM sources 
ORDER BY name;

-- Show article count after cleanup
SELECT COUNT(*) as total_articles, 
       COUNT(DISTINCT url) as unique_urls,
       COUNT(*) - COUNT(DISTINCT url) as duplicates_removed
FROM feed_items;