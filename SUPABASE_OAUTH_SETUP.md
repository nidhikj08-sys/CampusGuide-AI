# Supabase OAuth & Auth Configuration Guide

## Overview
This document explains how to configure Supabase Authentication for the CampusGuide app to enable:
- Email/password authentication
- Email confirmation flow
- Google OAuth (for campus SSO)
- Microsoft/Azure AD OAuth (for campus SSO)
- Password reset flow

---

## 1. Supabase Dashboard Configuration

### Authentication Settings
Go to **Supabase Dashboard → Authentication → Settings**

#### Site URL
```
https://your-domain.com
```
For local development: `http://localhost:5173`

#### Redirect URLs (Add ALL of these)
```
https://your-domain.com/auth/callback
https://your-domain.com/**
http://localhost:5173/auth/callback
http://localhost:5173/**
capacitor://localhost/auth/callback   (if using Capacitor mobile app)
```

#### Email Confirmation
- **Enable email confirmations**: ✅ ON
- **Enable email change confirmations**: ✅ ON
- **Secure email change**: ✅ ON
- **Enable phone confirmations**: Optional

#### Password Reset
- **Redirect to**: `https://your-domain.com/reset-password`

---

## 2. Google OAuth Setup

### Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
4. Application type: **Web application**
5. Name: `CampusGuide Web`
6. **Authorized redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   https://your-domain.com/auth/callback
   http://localhost:5173/auth/callback
   ```
7. Save → Copy **Client ID** and **Client Secret**

### Supabase Dashboard
1. **Authentication → Providers → Google**
2. **Enable Google**: ✅ ON
3. **Client ID**: Paste from Google Cloud Console
4. **Client Secret**: Paste from Google Cloud Console
5. **Scopes**: `openid email profile`
6. **Save**

---

## 3. Microsoft/Azure AD OAuth Setup

### Azure Portal
1. Go to [Azure Portal](https://portal.azure.com/) → **Microsoft Entra ID (Azure AD)**
2. **App registrations → New registration**
3. Name: `CampusGuide`
4. **Supported account types**: 
   - For campus: **Accounts in this organizational directory only** (Single tenant)
   - For multi-tenant: **Accounts in any organizational directory**
5. **Redirect URI**: Web → `https://your-project-ref.supabase.co/auth/v1/callback`
6. **Register**

### Get Credentials
1. **Overview** → Copy **Application (client) ID**
2. **Certificates & secrets → New client secret** → Copy **Value** (Client Secret)
3. **API permissions** → Add **Microsoft Graph** → **openid, email, profile** (delegated)

### Supabase Dashboard
1. **Authentication → Providers → Azure**
2. **Enable Azure**: ✅ ON
2. **Client ID**: Paste from Azure
3. **Client Secret**: Paste from Azure
4. **Tenant**: 
   - Single tenant: Your Azure AD tenant ID
   - Multi-tenant: `common`
5. **Save**

---

## 4. Email Templates (Optional Customization)

### Supabase Dashboard → Authentication → Email Templates

#### Confirm Signup
```html
<h2>Welcome to CampusGuide!</h2>
<p>Click the link below to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>This link expires in 24 hours.</p>
```

#### Reset Password
```html
<h2>Reset your CampusGuide password</h2>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
```

---

## 5. Database Setup (Run in Supabase SQL Editor)

```sql
-- Profiles table
create table if not exists profiles (
  id uuid references auth.users primary key,
  name text,
  email text,
  role text check (role in ('student','faculty','admin')),
  usn text,
  year text,
  section text,
  employee_id text,
  department text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Users can read own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Trigger: Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, role, usn, year, section, employee_id, department)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'usn',
    new.raw_user_meta_data->>'year',
    new.raw_user_meta_data->>'section',
    new.raw_user_meta_data->>'employee_id',
    new.raw_user_meta_data->>'department'
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 6. Environment Variables

Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For Vercel: Add in **Project Settings → Environment Variables**

---

## 7. Testing Checklist

| Feature | Test Steps |
|---------|------------|
| **Email signup** | Register → Check email → Click link → Auto-login → Dashboard |
| **Google OAuth** | Click Google → Consent → Redirect → Dashboard |
| **Microsoft OAuth** | Click Microsoft → Consent → Redirect → Dashboard |
| **Email confirmation** | Register → Don't confirm → Try login → "Confirm email" error |
| **Password reset** | Forgot password → Email → Link → New password → Login |
| **Role redirect** | Login as student → /student, faculty → /faculty, admin → /admin |

---

## 7. Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| OAuth "redirect_uri_mismatch" | Wrong redirect URL in provider config | Match exactly: `https://project-ref.supabase.co/auth/v1/callback` |
| Email confirmation 404 | Wrong Site URL in Supabase | Set correct Site URL in Auth Settings |
| "Invalid login credentials" | Email not confirmed | Enable email confirmation in Supabase |
| Role not redirecting | Profile not created | Check trigger function exists |
| Google OAuth blocked | Unverified app | Verify in Google Cloud Console or use test users |

---

## 8. Production Checklist

- [ ] Site URL set to production domain
- [ ] All redirect URLs added
- [ ] Google OAuth verified (not "Testing" mode)
- [ ] Microsoft Azure app published
- [ ] Email templates customized
- [ ] Rate limits configured
- [ ] RLS policies tested
- [ ] Mobile app redirect URLs added (if using Capacitor)

---

## Support

For Supabase issues: [Supabase Discord](https://discord.supabase.com/) or [GitHub Discussions](https://github.com/supabase/supabase/discussions)

For CampusGuide issues: Check application logs in Vercel/Netlify dashboard