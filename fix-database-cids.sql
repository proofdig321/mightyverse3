-- Fix contaminated CIDs in database
-- Asset "Test 2" has wrong CID (PNG instead of video)

-- Option 1: Delete the problematic asset
DELETE FROM assets WHERE id = '7456590f-39d3-4f8c-b1e6-3eaa9caec9bc' AND name = 'Test 2';

-- Option 2: Fix the CID if we know the correct video CID
-- UPDATE assets 
-- SET file_cid = 'correct_video_cid_here',
--     mime_type = 'video/mp4',
--     updated_at = NOW()
-- WHERE id = '7456590f-39d3-4f8c-b1e6-3eaa9caec9bc';

-- Verify remaining assets
SELECT id, name, file_cid, mime_type, asset_type 
FROM assets 
WHERE asset_type = 'video' OR mime_type LIKE 'video/%'
ORDER BY created_at DESC;