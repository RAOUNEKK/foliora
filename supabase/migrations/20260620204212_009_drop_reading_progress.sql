/*
# Remove reading_progress table

The reading tracker feature has been removed from the application.
This migration drops the reading_progress table and its associated trigger.
*/

DROP TRIGGER IF EXISTS reading_progress_updated_at ON reading_progress;
DROP TABLE IF EXISTS reading_progress CASCADE;