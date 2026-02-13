# Contact Form Database Setup Guide

## 🐛 Problem Identified

The Contact page (`http://localhost:5173/contact`) "Send Message" button is **not working** because:

❌ **Missing Table:** The `contact_submissions` table does not exist in your Supabase database

❌ **Frontend Code:** Contact.jsx is trying to insert into `contact_submissions` table

❌ **Error:** Supabase returns error when form is submitted

---

## ✅ Solution

We've created a new database migration file that will:

1. Create the `contact_submissions` table
2. Add proper validation and constraints
3. Set up indexes for performance
4. Configure Row Level Security (RLS) policies
5. Add automatic timestamp updates

---

## 🛠️ Migration File Created

**File:** `database/migrations/008_create_contact_submissions_table.sql`

**Location:** [`/database/migrations/008_create_contact_submissions_table.sql`](./database/migrations/008_create_contact_submissions_table.sql)

**Commit:** `da526e7c5e4d92428261a1762909a6e9b8cf4d34`

---

## 📊 Database Schema

### Table: `contact_submissions`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID | PRIMARY KEY, AUTO | Unique identifier |
| `name` | TEXT | NOT NULL, min 2 chars | Sender's name |
| `email` | TEXT | NOT NULL, valid email | Sender's email |
| `subject` | TEXT | NOT NULL, min 3 chars | Message subject |
| `message` | TEXT | NOT NULL, min 10 chars | Message content |
| `status` | ENUM | NOT NULL, default 'new' | Status: new/read/replied/archived |
| `admin_notes` | TEXT | NULLABLE | Internal notes for admin |
| `replied_at` | TIMESTAMP | NULLABLE | When admin replied |
| `created_at` | TIMESTAMP | NOT NULL, AUTO | Submission timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, AUTO | Last update timestamp |

### Indexes Created

1. `idx_contact_submissions_status` - For filtering by status
2. `idx_contact_submissions_created_at` - For sorting by date
3. `idx_contact_submissions_email` - For email lookups
4. `idx_contact_submissions_status_created` - Composite for admin queries

### Status Enum Values

- `new` - Just submitted, not yet viewed
- `read` - Admin has viewed the submission
- `replied` - Admin has replied to the sender
- `archived` - Old/resolved submissions

---

## 🚀 How to Run the Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard:**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy the Migration SQL:**
   - Open the file: `database/migrations/008_create_contact_submissions_table.sql`
   - Copy the entire contents

4. **Paste and Execute:**
   - Paste the SQL into the Supabase SQL Editor
   - Click "Run" or press `Ctrl + Enter`

5. **Verify Success:**
   - You should see: "Success. No rows returned"
   - Check the "Table Editor" to see the new `contact_submissions` table

### Option 2: Supabase CLI

```bash
# Navigate to your project directory
cd /path/to/shreephal-handicrafts

# Run the migration
supabase db push --db-url "your-database-connection-string"
```

### Option 3: Direct PostgreSQL Connection

```bash
# Connect to your database
psql "postgresql://user:pass@db.xxx.supabase.co:5432/postgres"

# Run the migration file
\i database/migrations/008_create_contact_submissions_table.sql

# Verify table exists
\dt contact_submissions
```

---

## ✅ Verification Steps

### 1. Check Table Exists

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'contact_submissions';
```

**Expected:** Returns 1 row with table name

### 2. Check Columns

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contact_submissions' 
ORDER BY ordinal_position;
```

**Expected:** Returns 10 columns (id, name, email, subject, message, status, admin_notes, replied_at, created_at, updated_at)

### 3. Check Indexes

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'contact_submissions';
```

**Expected:** Returns 4-5 indexes (including primary key)

### 4. Check RLS Policies

```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'contact_submissions';
```

**Expected:** Returns at least 2 policies (insert for anon, select for authenticated)

---

## 🧪 Testing the Contact Form

### Test Submission

1. **Navigate to Contact Page:**
   ```
   http://localhost:5173/contact
   ```

2. **Fill Out Form:**
   - Name: Test User
   - Email: test@example.com
   - Subject: Test Submission
   - Message: This is a test message from the contact form.

3. **Click "Send Message"**

4. **Expected Result:**
   - ✅ Success toast notification: "Message Sent Successfully!"
   - ✅ Form shows success message with green checkmark
   - ✅ Form resets after 3 seconds

### Verify in Database

```sql
-- Check if submission was saved
SELECT * FROM contact_submissions 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected:** Returns your test submission with:
- name: "Test User"
- email: "test@example.com"
- status: "new"
- created_at: Recent timestamp

---

## 📊 Viewing Submissions (Admin Queries)

### Get All New Submissions

```sql
SELECT 
  id,
  name,
  email,
  subject,
  LEFT(message, 50) || '...' as message_preview,
  status,
  created_at
FROM contact_submissions 
WHERE status = 'new' 
ORDER BY created_at DESC;
```

### Get All Submissions with Statistics

```sql
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as last_submission
FROM contact_submissions 
GROUP BY status
ORDER BY count DESC;
```

### Find Submissions by Email

```sql
SELECT * 
FROM contact_submissions 
WHERE email = 'customer@example.com' 
ORDER BY created_at DESC;
```

### Mark Submission as Read

```sql
UPDATE contact_submissions 
SET status = 'read' 
WHERE id = 'your-submission-uuid';
```

### Mark as Replied

```sql
UPDATE contact_submissions 
SET 
  status = 'replied',
  replied_at = CURRENT_TIMESTAMP,
  admin_notes = 'Replied via email on 2026-02-13'
WHERE id = 'your-submission-uuid';
```

---

## 🔒 Security (Row Level Security)

### Current RLS Policies

1. **Anyone can submit:** Anonymous and authenticated users can INSERT
2. **Users can view own:** Authenticated users can view their own submissions by email
3. **Admin access:** (Commented out - needs proper admin role implementation)

### Future: Admin Role Setup

To enable admin-only access to all submissions:

1. Set up custom claims in Supabase Auth
2. Add `role: 'admin'` to admin users' JWT
3. Uncomment the admin policies in the migration file
4. Re-run the admin policy portion

---

## ⚠️ Troubleshooting

### Error: "relation 'contact_submissions' does not exist"

**Cause:** Migration not run yet

**Solution:** Run the migration SQL in Supabase dashboard

### Error: "permission denied for table contact_submissions"

**Cause:** RLS policy blocking insert

**Solution:** 
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'contact_submissions';

-- Check policies
SELECT * FROM pg_policies 
WHERE tablename = 'contact_submissions';

-- If no insert policy exists, run:
CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

### Error: "new row violates check constraint"

**Cause:** Form validation not met (e.g., name too short)

**Solution:** Ensure form data meets these requirements:
- Name: At least 2 characters
- Email: Valid email format
- Subject: At least 3 characters
- Message: At least 10 characters

### Form Submits but No Toast Notification

**Check:** Browser console for errors

```javascript
// In Contact.jsx, add debug logging:
console.log('Submitting contact form:', formData);

// After insert:
console.log('Supabase response:', { data, error });
```

---

## 📝 Sample Data for Testing

```sql
-- Insert sample submissions for testing
INSERT INTO contact_submissions (name, email, subject, message) VALUES
  ('John Doe', 'john@example.com', 'Product Inquiry', 'I am interested in your custom trophies. Can you provide bulk pricing?'),
  ('Jane Smith', 'jane@example.com', 'Order Status', 'What is the status of my order #12345?'),
  ('Bob Wilson', 'bob@example.com', 'Customization Request', 'Can you create a trophy with our company logo?');

-- Verify inserts
SELECT COUNT(*) as total_submissions FROM contact_submissions;
```

---

## 📖 Next Steps: Admin Panel

Once the table is working, consider building an admin panel to:

1. **View all submissions** in a table
2. **Filter by status** (new, read, replied, archived)
3. **Search by email** or subject
4. **Mark as read/replied** with one click
5. **Add admin notes** for internal tracking
6. **Delete spam** submissions
7. **Export to CSV** for record keeping

### Suggested Admin Panel Location

- URL: `/admin/contact-submissions`
- Protected route requiring admin authentication
- Use React Table or similar for data display
- Add status badges with colors:
  - 🔴 Red for "new"
  - 🟡 Yellow for "read"
  - 🟢 Green for "replied"
  - ⚫ Gray for "archived"

---

## ✅ Summary

✅ **Migration file created:** `008_create_contact_submissions_table.sql`

✅ **Table structure:** 10 columns with proper validation

✅ **Indexes added:** 4 indexes for performance

✅ **RLS enabled:** Anonymous can submit, authenticated can view own

✅ **Auto timestamps:** created_at and updated_at auto-managed

✅ **Status tracking:** Enum with 4 states (new/read/replied/archived)

✅ **Ready to use:** Just run the migration SQL in Supabase dashboard!

---

## 📞 Need Help?

If you encounter any issues:

1. Check Supabase dashboard logs
2. Verify table exists in Table Editor
3. Check RLS policies are active
4. Test with simple INSERT query in SQL Editor
5. Review browser console for JavaScript errors

**Contact form should work immediately after running the migration!** 🎉
