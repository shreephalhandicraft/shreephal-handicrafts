# Password Reset Troubleshooting Guide

## Issues You're Experiencing

### ❌ Issue 1: 404 Page After Clicking Reset Link

**What's Happening:**
- You receive the reset email
- Click the link: `https://shreephalhandicrafts.com/reset-password?token=...&type=recovery`
- Get redirected to 404 page

**Root Cause:**
The production website (`https://shreephalhandicrafts.com`) is running code from the `main` branch, which **doesn't have the password reset feature yet**. The new code with `/reset-password` route is only in the `feature/supabase-auth-and-checkout-fix` branch.

**Solution:**
✅ **Deploy the feature branch to production**

Options:
1. **Merge to main and deploy** (Recommended)
   ```bash
   # After testing locally
   git checkout main
   git merge feature/supabase-auth-and-checkout-fix
   git push origin main
   ```

2. **Deploy feature branch directly** (For testing)
   - If using Vercel/Netlify: Deploy the feature branch as a preview
   - Test with the preview URL before merging to main

3. **Test locally first**
   ```bash
   git checkout feature/supabase-auth-and-checkout-fix
   cd frontend
   npm install
   npm run dev
   ```
   - Update Supabase redirect URLs to include `http://localhost:5173/reset-password`
   - Test the complete flow locally

---

### ⚠️ Issue 2: Button Not Visible in Email

**What's Happening:**
- Email arrives but reset button is invisible
- You can still click where the button should be
- The link works when clicked

**Root Cause:**
The default Supabase email template uses minimal HTML without proper inline CSS styling. Email clients (especially Gmail, Outlook) strip out `<style>` tags and require inline styles.

**Solution:**
✅ **Update Supabase Email Template**

1. **Go to Supabase Dashboard:**
   - Navigate to: `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/auth/templates`
   - Or: Dashboard → Authentication → Email Templates

2. **Select "Password Recovery" template**

3. **Replace the template with styled HTML:**

   I've created a professional template at:
   [`docs/SUPABASE_EMAIL_TEMPLATE.html`](./SUPABASE_EMAIL_TEMPLATE.html)

   **Copy the entire HTML from that file and paste it into the Supabase template editor.**

4. **Key Features of the New Template:**
   - ✅ Inline CSS for maximum email client compatibility
   - ✅ Prominent golden button matching your brand
   - ✅ Fallback text link if button fails
   - ✅ Professional layout with Shreephal Handicrafts branding
   - ✅ Responsive design for mobile devices
   - ✅ Security information (1-hour expiry notice)

5. **Important Variables:**
   The template uses these Supabase variables:
   - `{{ .SiteURL }}` - Your site URL
   - `{{ .TokenHash }}` - The password reset token
   - `{{ .Email }}` - Recipient's email

6. **Save and Test:**
   - Click "Save"
   - Send a test reset email from Supabase Dashboard
   - Check your inbox for the styled email

**Quick Fix Template (Minimal):**
If you want a simple fix right now, use this minimal template:

```html
<h2 style="color: #1a1a1a;">Reset Your Password</h2>
<p style="color: #4a4a4a; font-size: 16px;">Hi there,</p>
<p style="color: #4a4a4a; font-size: 16px;">
  You requested to reset your password for Shreephal Handicrafts.
</p>
<p style="margin: 30px 0;">
  <a href="{{ .SiteURL }}/reset-password?token={{ .TokenHash }}&type=recovery" 
     style="display: inline-block; background-color: #d4af37; color: #ffffff; 
            text-decoration: none; padding: 14px 40px; border-radius: 6px; 
            font-size: 16px; font-weight: 600;">
    Reset Password
  </a>
</p>
<p style="color: #6a6a6a; font-size: 14px;">
  This link expires in 1 hour.
</p>
<p style="color: #6a6a6a; font-size: 14px;">
  If you didn't request this, you can safely ignore this email.
</p>
```

---

### ✅ Issue 3: Auto-Login After Clicking Reset Link

**What's Happening:**
- After clicking the reset link, you're automatically logged in
- This seems unexpected

**Root Cause:**
**This is actually EXPECTED behavior from Supabase!**

When a user clicks the password reset link:
1. Supabase creates a **recovery session** (temporary login)
2. User needs to be authenticated to change their password
3. The `type=recovery` parameter tells your app this is a password reset flow
4. After password change, user is logged out and must login with new password

**Why This Design?**
- Security: Ensures only the person with email access can reset password
- User Experience: No need to re-enter email
- Supabase Standard: This is how Supabase auth works

**How Your Code Handles It:**
Your `ResetPassword.jsx` component:
1. Detects the recovery session
2. Checks for `type=recovery` in URL
3. Shows password reset form (not regular logged-in pages)
4. After password update: **automatically logs out**
5. Redirects to login page
6. User must login with new password

**This is correct behavior! No fix needed.**

**What You Should See:**
```
User Flow:
1. Click email link → Auto-logged in with recovery session
2. Sees /reset-password page (not redirected elsewhere)
3. Enters new password
4. Submits form
5. Gets logged out automatically
6. Redirected to /login
7. Logs in with NEW password
```

---

## Testing Checklist

### Before Deploying to Production:

- [ ] **Local Testing**
  - [ ] Clone feature branch
  - [ ] Run `npm install` and `npm run dev`
  - [ ] Update Supabase redirect URLs to include `localhost:5173`
  - [ ] Test forgot password flow end-to-end
  - [ ] Verify reset password page appears
  - [ ] Test password change works
  - [ ] Confirm auto-logout after reset
  - [ ] Login with new password successfully

- [ ] **Email Template**
  - [ ] Update Supabase email template with styled HTML
  - [ ] Send test email from Supabase dashboard
  - [ ] Verify button is visible
  - [ ] Click button and verify redirect works
  - [ ] Check mobile email clients (Gmail app, iOS Mail)

- [ ] **Supabase Configuration**
  - [ ] Verify Site URL is set correctly
  - [ ] Confirm redirect URLs include production domain
  - [ ] Check token expiry time (default 1 hour)
  - [ ] Test rate limiting (try multiple requests)

### After Deploying to Production:

- [ ] **Smoke Test**
  - [ ] Visit production site
  - [ ] Go to /forgot-password
  - [ ] Request password reset
  - [ ] Check email arrives
  - [ ] Click link in email
  - [ ] Verify /reset-password page loads (no 404)
  - [ ] Change password successfully
  - [ ] Login with new password

- [ ] **Edge Cases**
  - [ ] Try expired link (wait 1 hour)
  - [ ] Try reusing same link twice
  - [ ] Test invalid email at forgot password
  - [ ] Test weak password validation
  - [ ] Test password mismatch

---

## Current Status Summary

### ✅ What's Working:
- Change Password (from Personal Details page)
- Email sending from Supabase
- Reset link generation
- Recovery session creation
- Password validation

### ⚠️ What Needs Fixing:
1. **404 Error** → Deploy feature branch to production
2. **Invisible Button** → Update email template in Supabase dashboard

### ✅ What's Actually Correct:
- Auto-login behavior (this is by design)
- URL structure with token
- Recovery session flow

---

## Quick Fix Steps (Right Now)

### 1. Fix Email Button (5 minutes)

1. Go to: https://supabase.com/dashboard/project/ichiqephsulnvwmypiia/auth/templates
2. Click "Password Recovery"
3. Copy HTML from [`docs/SUPABASE_EMAIL_TEMPLATE.html`](./SUPABASE_EMAIL_TEMPLATE.html)
4. Paste into template editor
5. Click "Save"
6. Test by requesting password reset

### 2. Deploy to Production (depends on your setup)

**If using Vercel:**
```bash
# Push to trigger deployment
git push origin feature/supabase-auth-and-checkout-fix
```
Then in Vercel dashboard:
- Go to your project
- Select the feature branch
- Deploy
- Test with preview URL
- If works, merge to main

**If using Netlify:**
- Similar process in Netlify dashboard

**If manual deployment:**
```bash
# On production server
git pull origin feature/supabase-auth-and-checkout-fix
cd frontend
npm install
npm run build
# Restart your server/nginx
```

---

## Need Help?

**Common Questions:**

Q: Why does Supabase auto-login during password reset?  
A: Security and UX. It's standard OAuth2/OIDC flow. Your code handles it correctly.

Q: Can I skip the auto-login?  
A: Not recommended. It's how Supabase Auth works. Fighting it will cause more issues.

Q: The button still doesn't show after updating template?  
A: Clear browser cache, check spam folder, try different email client.

Q: Link still goes to 404?  
A: The feature branch isn't deployed yet. Check your deployment setup.

**If you still have issues, check:**
1. Browser console for errors
2. Supabase logs in dashboard
3. Network tab in DevTools
4. Environment variables are set correctly

---

**Last Updated:** February 13, 2026  
**Branch:** `feature/supabase-auth-and-checkout-fix`  
**Status:** ✅ Ready for Production Deployment
