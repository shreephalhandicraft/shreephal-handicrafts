-- ================================================================
-- MIGRATION 007: Setup Cron Job for Reservation Cleanup
-- ================================================================
-- Purpose: Auto-expire old reservations every 5 minutes
-- Date: January 24, 2026
-- Status: ✅ APPLIED
-- ================================================================

BEGIN;

-- ================================================================
-- 1. ENABLE PG_CRON EXTENSION
-- ================================================================

-- Enable extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

RAISE NOTICE 'pg_cron extension enabled';


-- ================================================================
-- 2. SCHEDULE CLEANUP JOB
-- ================================================================

-- Remove existing job if exists (for idempotency)
DO $$
BEGIN
  PERFORM cron.unschedule('expire-stock-reservations')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'expire-stock-reservations'
  );
END $$;

-- Schedule new job (every 5 minutes)
SELECT cron.schedule(
  'expire-stock-reservations',          -- Job name
  '*/5 * * * *',                         -- Cron: every 5 minutes
  'SELECT expire_old_stock_reservations();'
);

RAISE NOTICE 'Cron job scheduled: expire-stock-reservations (runs every 5 minutes)';


-- ================================================================
-- 3. VERIFY CRON JOB
-- ================================================================

DO $$
DECLARE
  v_job_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'expire-stock-reservations'
  ) INTO v_job_exists;
  
  IF v_job_exists THEN
    RAISE NOTICE '✅ Cron job verification successful';
  ELSE
    RAISE EXCEPTION '❌ Cron job verification failed';
  END IF;
END $$;

COMMIT;

-- ================================================================
-- VERIFICATION QUERY (Run to confirm)
-- ================================================================
/*
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'expire-stock-reservations';

-- Expected output:
-- jobname: expire-stock-reservations
-- schedule: */5 * * * *
-- command: SELECT expire_old_stock_reservations();
-- active: true
*/

-- ================================================================
-- MANUAL EXECUTION (for testing)
-- ================================================================
/*
-- Run cleanup manually
SELECT expire_old_stock_reservations();
-- Returns: count of expired reservations deleted

-- Check cron job execution history
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'expire-stock-reservations'
)
ORDER BY start_time DESC
LIMIT 10;
*/

-- ================================================================
-- MONITOR CRON JOB PERFORMANCE
-- ================================================================
/*
-- Check last 5 runs
SELECT 
  start_time,
  end_time,
  status,
  return_message,
  (end_time - start_time) AS duration
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'expire-stock-reservations'
)
ORDER BY start_time DESC
LIMIT 5;
*/

-- ================================================================
-- DISABLE/REMOVE CRON JOB (if needed)
-- ================================================================
/*
-- Unschedule the job
SELECT cron.unschedule('expire-stock-reservations');

-- Verify removal
SELECT * FROM cron.job WHERE jobname = 'expire-stock-reservations';
-- Expected: No rows
*/

-- ================================================================
-- TROUBLESHOOTING
-- ================================================================
/*
-- If cron job is not running:

1. Check if pg_cron extension is enabled:
   SELECT * FROM pg_available_extensions WHERE name = 'pg_cron';
   -- installed_version should NOT be null

2. Check if job is active:
   SELECT jobname, active FROM cron.job WHERE jobname = 'expire-stock-reservations';
   -- active should be true

3. Check for errors in job history:
   SELECT status, return_message 
   FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'expire-stock-reservations')
   AND status = 'failed'
   ORDER BY start_time DESC;

4. Test function manually:
   SELECT expire_old_stock_reservations();
   -- Should return count of deleted reservations
*/
