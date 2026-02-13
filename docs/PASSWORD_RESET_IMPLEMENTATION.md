# Password Reset & Change Implementation

## Overview

This document describes the complete password reset and change functionality implementation using Supabase Auth.

## ✅ Features Implemented

1. **Forgot Password Flow**
   - User requests password reset via email
   - Supabase sends secure reset link
   - 1-hour token expiration
   - Email validation

2. **Reset Password Page**
   - Token verification from URL
   - Password strength validation
   - Confirmation matching
   - Invalid/expired link handling

3. **Change Password (Logged In)**
   - Modal dialog for password change
   - Available in Personal Details page
   - No email required (already authenticated)

## Architecture

### Flow Diagram

```
Forgot Password Flow:
User → /forgot-password → Enter Email → Supabase Auth API → Email Sent
↓
User Clicks Link → /reset-password?token=xxx&type=recovery
↓
Token Verified → New Password → Supabase Updates Password → Redirect to Login

Change Password Flow:
User → /personal-details → Security Section → Change Password Dialog
↓
New Password → Supabase Auth → Password Updated → Success Toast
```

## Files Changed

### 1. Core Configuration

#### `frontend/src/lib/supabaseClient.js`
**Changes:**
- Added auth configuration object
- Enabled `detectSessionInUrl` for password reset tokens
- Configured session persistence
- Set custom storage key

**Why:** Supabase needs to detect the recovery token in the URL and establish a session for password reset.

### 2. Authentication Context

#### `frontend/src/contexts/AuthContext.jsx`
**New Methods:**
- `requestPasswordReset(email)` - Sends reset email
- `changePassword(newPassword)` - Updates password for logged-in users
- `resetPassword(newPassword)` - Updates password using recovery token

**Why:** Centralizes all auth operations and makes them available throughout the app.

### 3. New Pages

#### `frontend/src/pages/ForgotPassword.jsx`
**Features:**
- Email input with validation
- Success state with instructions
- Option to resend to different email
- Link back to login

#### `frontend/src/pages/ResetPassword.jsx`
**Features:**
- Recovery session verification
- Password strength requirements
- Confirmation matching
- Invalid/expired link error state
- Auto-logout after successful reset

### 4. New Components

#### `frontend/src/components/ChangePassword.jsx`
**Features:**
- Modal dialog interface
- Password validation
- Show/hide password toggles
- Success notification

### 5. Updated Components

#### `frontend/src/components/PersonalDetailsView.jsx`
**Changes:**
- Added Security section card
- Integrated ChangePassword component
- Added Shield icon and descriptive text

### 6. Routing

#### `frontend/src/App.jsx`
**New Routes:**
- `/forgot-password` - ForgotPassword page (PublicRoute)
- `/reset-password` - ResetPassword page (PublicRoute)

## Supabase Dashboard Configuration

### Required Settings

1. **Navigate to:** Authentication → URL Configuration

2. **Site URL:**
   ```
   https://shreephalhandicraft.com
   ```

3. **Redirect URLs (Add these):**
   ```
   https://shreephalhandicraft.com/reset-password
   https://shreephalhandicraft.com/auth/callback
   http://localhost:5173/reset-password
   http://localhost:5173/auth/callback
   ```

4. **Email Templates → Password Recovery:**
   - Customize email subject and body
   - Use `{{ .SiteURL }}/reset-password?token={{ .TokenHash }}&type=recovery`
   - Set expiration (default: 1 hour)

## Security Features

### ✅ Built-in Security

1. **Token-based reset**
   - Supabase generates secure, random tokens
   - Tokens are single-use
   - 1-hour expiration (configurable)

2. **Email verification**
   - Only account owner receives reset link
   - No information leakage (shows success even for non-existent emails)

3. **HTTPS enforcement**
   - All tokens transmitted over secure connection
   - Session cookies are httpOnly and secure

4. **Password validation**
   - Minimum 6 characters
   - Requires uppercase, lowercase, and number
   - Confirmation matching

5. **Rate limiting**
   - Supabase prevents brute force attempts
   - Email sending throttled

## Testing Checklist

### Forgot Password Flow

- [ ] Navigate to `/forgot-password`
- [ ] Enter invalid email → Shows validation error
- [ ] Enter valid email → Shows success message
- [ ] Check email inbox → Receives reset link
- [ ] Click reset link → Redirects to `/reset-password`
- [ ] Enter mismatched passwords → Shows error
- [ ] Enter weak password → Shows validation error
- [ ] Enter valid password → Success, redirects to login
- [ ] Try to use reset link again → Shows expired error

### Reset Password Page

- [ ] Access `/reset-password` without token → Shows invalid link error
- [ ] Access with expired token → Shows expired error
- [ ] Access with valid token → Shows password form
- [ ] Submit with weak password → Shows validation error
- [ ] Submit with valid password → Success, redirects to login
- [ ] Login with new password → Success

### Change Password (Logged In)

- [ ] Login to account
- [ ] Navigate to `/personal-details`
- [ ] See Security section with "Change Password" button
- [ ] Click "Change Password" → Dialog opens
- [ ] Enter mismatched passwords → Shows error
- [ ] Enter valid password → Success toast
- [ ] Logout and login with new password → Success

### Edge Cases

- [ ] Network error during reset → Shows error message
- [ ] Close browser during reset → Can resume with link
- [ ] Open reset link in different browser → Works correctly
- [ ] Request multiple reset emails → Only latest works
- [ ] Change password while logged in on multiple devices → All sessions updated

## Troubleshooting

### Issue: Reset link doesn't work

**Possible Causes:**
1. Redirect URL not configured in Supabase dashboard
2. Token expired (> 1 hour old)
3. Token already used

**Solution:**
- Check Supabase dashboard URL configuration
- Request new reset link
- Clear browser cache/cookies

### Issue: Email not received

**Possible Causes:**
1. Email in spam folder
2. Invalid email address
3. Supabase email service delay

**Solution:**
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes and check again
- Check Supabase logs for email sending errors

### Issue: "Invalid session" error

**Possible Causes:**
1. `detectSessionInUrl` not enabled in Supabase config
2. URL parameters stripped by browser/proxy
3. CORS issue

**Solution:**
- Verify `supabaseClient.js` has correct auth config
- Check browser console for errors
- Ensure redirect URL matches exactly (including protocol)

## Environment Variables

Ensure these are set:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Production Deployment

### Pre-deployment Checklist

- [ ] Update Supabase redirect URLs with production domain
- [ ] Test email delivery in production environment
- [ ] Verify HTTPS is enforced
- [ ] Test password reset flow end-to-end
- [ ] Monitor Supabase logs for any errors

### Post-deployment Monitoring

- Monitor password reset success rate
- Check email delivery rates
- Review user feedback on password reset UX
- Monitor Supabase auth logs for errors

## Additional Notes

### Password Requirements

Current requirements:
- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

To modify requirements, update validation in:
- `ResetPassword.jsx` (line ~55)
- `ChangePassword.jsx` (line ~35)

### Email Template Customization

To customize the password reset email:
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Select "Password Recovery"
3. Modify HTML template
4. Use variables: `{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .Email }}`

### Session Management

Password reset uses Supabase's recovery session:
- Separate from normal login session
- Automatically expires after password update
- User must login with new password

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs/guides/auth/passwords
2. Review Supabase logs in dashboard
3. Check browser console for client-side errors
4. Contact Supabase support if server-side issue

---

**Implementation Date:** February 13, 2026  
**Branch:** `feature/supabase-auth-and-checkout-fix`  
**Status:** ✅ Complete - Ready for Testing
