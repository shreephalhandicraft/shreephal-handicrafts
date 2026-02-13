-- ============================================
-- Create contact_submissions table
-- ============================================
-- Purpose: Store contact form submissions from website
-- Created: 2026-02-13
-- ============================================

-- Create status enum for contact submissions
CREATE TYPE contact_status AS ENUM ('new', 'read', 'replied', 'archived');

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact Information
  name TEXT NOT NULL CHECK (char_length(name) >= 2),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  subject TEXT NOT NULL CHECK (char_length(subject) >= 3),
  message TEXT NOT NULL CHECK (char_length(message) >= 10),
  
  -- Status and Management
  status contact_status NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Index for fetching by status (for admin panel)
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status 
  ON contact_submissions(status);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at 
  ON contact_submissions(created_at DESC);

-- Index for email lookups (find previous submissions from same email)
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email 
  ON contact_submissions(email);

-- Composite index for status + created_at (common query pattern)
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status_created 
  ON contact_submissions(status, created_at DESC);

-- ============================================
-- Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (submit contact form)
-- This allows anonymous users to submit the contact form
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Only authenticated admin users can view submissions
-- Replace 'admin_role' with your actual admin role name
-- For now, let's allow authenticated users to view their own submissions by email
CREATE POLICY "Users can view own submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- Policy: Only admins can update submissions (add notes, change status)
-- You'll need to implement proper admin role checking
-- For now, this is commented out - uncomment when admin system is ready
/*
CREATE POLICY "Admins can update submissions"
  ON contact_submissions
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all submissions"
  ON contact_submissions
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
*/

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE contact_submissions IS 'Stores contact form submissions from website visitors';
COMMENT ON COLUMN contact_submissions.id IS 'Unique identifier for the submission';
COMMENT ON COLUMN contact_submissions.name IS 'Name of the person submitting the form';
COMMENT ON COLUMN contact_submissions.email IS 'Email address for response';
COMMENT ON COLUMN contact_submissions.subject IS 'Subject line of the inquiry';
COMMENT ON COLUMN contact_submissions.message IS 'The actual message content';
COMMENT ON COLUMN contact_submissions.status IS 'Current status: new, read, replied, or archived';
COMMENT ON COLUMN contact_submissions.admin_notes IS 'Internal notes for admin use';
COMMENT ON COLUMN contact_submissions.replied_at IS 'Timestamp when admin replied to this submission';
COMMENT ON COLUMN contact_submissions.created_at IS 'When the submission was created';
COMMENT ON COLUMN contact_submissions.updated_at IS 'Last update timestamp';

-- ============================================
-- Sample Query for Admin Panel
-- ============================================

/*
-- Get all new submissions
SELECT * FROM contact_submissions 
WHERE status = 'new' 
ORDER BY created_at DESC;

-- Get submissions by email
SELECT * FROM contact_submissions 
WHERE email = 'customer@example.com' 
ORDER BY created_at DESC;

-- Mark submission as read
UPDATE contact_submissions 
SET status = 'read' 
WHERE id = 'submission-uuid';

-- Mark as replied with timestamp
UPDATE contact_submissions 
SET status = 'replied', replied_at = CURRENT_TIMESTAMP 
WHERE id = 'submission-uuid';

-- Get statistics
SELECT 
  status,
  COUNT(*) as count
FROM contact_submissions 
GROUP BY status;
*/
