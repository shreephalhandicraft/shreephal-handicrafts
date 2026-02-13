# Fix Supabase Email Verification Template

## 🚨 Problem

When users register, they receive a "Confirm Your Email" message from Supabase, but **the email is blank/has no content**.

---

## ✅ Solution: Configure Email Templates in Supabase Dashboard

### **Step 1: Access Supabase Dashboard**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **Shreephal Handicrafts**
3. Navigate to: **Authentication** (left sidebar)
4. Click on: **Email Templates** tab

---

### **Step 2: Configure "Confirm Signup" Template**

1. Find: **Confirm signup** template
2. Click **Edit**
3. Replace the content with the template below
4. Click **Save**

---

## 📧 **Professional Email Template**

### **Subject Line:**
```
Verify Your Email - Shreephal Handicrafts
```

### **Email Body (HTML):**

```html
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
  <!-- Header with Logo -->
  <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🪔 Shreephal Handicrafts</h1>
    <p style="color: rgba(255,255,255,0.95); margin: 8px 0 0 0; font-size: 14px;">Traditional Crafts with Modern Touch</p>
  </div>

  <!-- Main Content -->
  <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Welcome to <strong>Shreephal Handicrafts</strong>! We're excited to have you join our community.
    </p>

    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
      Please verify your email address by clicking the button below. This helps us ensure the security of your account.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); transition: all 0.3s ease;">
        ✓ Verify Email Address
      </a>
    </div>

    <!-- Alternative Link -->
    <div style="margin: 32px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #f97316;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
        <strong>Button not working?</strong> Copy and paste this link into your browser:
      </p>
      <p style="color: #3b82f6; font-size: 13px; word-break: break-all; margin: 0;">
        {{ .ConfirmationURL }}
      </p>
    </div>

    <!-- Security Note -->
    <div style="margin: 24px 0; padding: 16px; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fbbf24;">
      <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
        ⚠️ <strong>Security Note:</strong> This link will expire in 24 hours. If you didn't create an account with Shreephal Handicrafts, you can safely ignore this email.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

    <!-- Footer Info -->
    <div style="text-align: center;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
        After verification, you'll be able to:
      </p>
      <ul style="list-style: none; padding: 0; margin: 0; color: #6b7280; font-size: 14px;">
        <li style="margin: 8px 0;">✓ Browse our collection of handcrafted trophies</li>
        <li style="margin: 8px 0;">✓ Customize products with your preferences</li>
        <li style="margin: 8px 0;">✓ Track your orders and shipping</li>
        <li style="margin: 8px 0;">✓ Save your favorite items</li>
      </ul>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0 0 8px 0;">© 2026 Shreephal Handicrafts. All rights reserved.</p>
    <p style="margin: 0 0 8px 0;">
      <a href="mailto:support@shreephalhandicrafts.com" style="color: #f97316; text-decoration: none;">Need Help?</a> | 
      <a href="https://shreephalhandicrafts.com" style="color: #f97316; text-decoration: none;">Visit Website</a>
    </p>
    <p style="margin: 8px 0 0 0; color: #d1d5db; font-size: 11px;">
      This is an automated email. Please do not reply to this message.
    </p>
  </div>
</div>
```

---

## 🎨 **Template Features:**

✅ **Professional Design:**
- Branded header with gradient background
- Clean, modern layout
- Mobile-responsive
- Clear call-to-action button

✅ **Security Features:**
- Expiration warning (24 hours)
- Security note for unintended recipients
- Alternative link if button doesn't work

✅ **User-Friendly:**
- Easy-to-click verification button
- Benefits list (what they can do after verification)
- Help and support links
- Professional footer

---

## 🧪 **Testing:**

### **Test the Email Template:**

1. **Create Test Account:**
   ```
   - Go to: http://localhost:5173/register
   - Enter test email (use your own email)
   - Fill registration form
   - Submit
   ```

2. **Check Email Inbox:**
   - Wait 1-2 minutes for email
   - Check spam folder if not in inbox
   - Verify email has proper formatting
   - Verify button works

3. **Verify Functionality:**
   - Click "Verify Email Address" button
   - Should redirect to login/confirmation page
   - Try logging in with new account
   - Should work after verification

---

## 🔧 **Other Email Templates to Configure:**

While you're in the Email Templates section, also configure these:

### **1. Magic Link (for passwordless login)**
```
Subject: Your Magic Link - Shreephal Handicrafts
```

### **2. Reset Password**
```
Subject: Reset Your Password - Shreephal Handicrafts
```

### **3. Email Change Confirmation**
```
Subject: Confirm Your New Email - Shreephal Handicrafts
```

**Use similar styling** as the signup confirmation template for consistency.

---

## ⚙️ **Additional Configuration:**

### **SMTP Settings (Optional but Recommended):**

For production, configure custom SMTP:

1. Go to: **Project Settings** → **Auth** → **SMTP Settings**
2. Configure:
   - **SMTP Host:** Your email provider's SMTP server
   - **SMTP Port:** 587 (TLS) or 465 (SSL)
   - **SMTP User:** Your email address
   - **SMTP Password:** Your email password/app password
   - **Sender Email:** noreply@shreephalhandicrafts.com
   - **Sender Name:** Shreephal Handicrafts

**Benefits:**
- Better deliverability
- Custom sender address
- Branded "From" field
- Less likely to go to spam

---

## 🚨 **Troubleshooting:**

### **Issue 1: Email Not Received**

**Possible Causes:**
- Email in spam folder
- Wrong email address
- Supabase rate limiting
- SMTP not configured

**Solutions:**
1. Check spam/junk folder
2. Verify email address is correct
3. Wait 5 minutes and try again
4. Check Supabase logs: **Logs** → **Auth Logs**

---

### **Issue 2: Verification Link Doesn't Work**

**Possible Causes:**
- Link expired (>24 hours old)
- Already verified
- Wrong redirect URL

**Solutions:**
1. Request new verification email
2. Check if account is already verified
3. Verify Site URL in: **Authentication** → **URL Configuration**
   - Should be: `http://localhost:5173` (dev) or `https://yourdomain.com` (prod)

---

### **Issue 3: Template Variables Not Working**

**Possible Causes:**
- Wrong variable syntax
- Template not saved

**Solutions:**
1. Verify variable syntax: `{{ .ConfirmationURL }}`
2. Click **Save** after editing template
3. Test with new signup

---

## 📋 **Template Variables Reference:**

Use these variables in email templates:

| Variable | Description | Example |
|----------|-------------|----------|
| `{{ .ConfirmationURL }}` | Email verification link | Used in signup confirmation |
| `{{ .Token }}` | Raw token | For custom verification flows |
| `{{ .TokenHash }}` | Hashed token | For security |
| `{{ .SiteURL }}` | Your site URL | Links back to your app |
| `{{ .Email }}` | User's email | Personalization |

---

## ✅ **Verification Checklist:**

- [ ] Email template updated in Supabase dashboard
- [ ] Subject line configured
- [ ] HTML formatting looks correct in preview
- [ ] `{{ .ConfirmationURL }}` variable included
- [ ] Alternative link section included
- [ ] Security warning included
- [ ] Footer with company info included
- [ ] Template saved successfully
- [ ] Test email sent
- [ ] Test email received (check spam)
- [ ] Email displays correctly in inbox
- [ ] Verification button works
- [ ] Alternative link works
- [ ] Account becomes active after verification
- [ ] Can log in after verification

---

## 🎯 **Success Metrics:**

After implementing:

✅ **Email Deliverability:** 95%+ of emails reach inbox  
✅ **Verification Rate:** 80%+ of users verify  
✅ **User Experience:** Professional, branded emails  
✅ **Trust:** Users feel confident about security  

---

## 📞 **Need Help?**

If issues persist:

1. **Check Supabase Logs:**
   - Dashboard → Logs → Auth Logs
   - Look for email sending errors

2. **Supabase Documentation:**
   - [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
   - [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

3. **Test Email Service:**
   - Use [MailTrap](https://mailtrap.io) for dev testing
   - Catches all emails without sending to real inboxes

---

**Status:** ✅ Ready to Implement  
**Priority:** 🔴 Critical (users can't verify accounts without this)  
**Time to Fix:** ~10 minutes
