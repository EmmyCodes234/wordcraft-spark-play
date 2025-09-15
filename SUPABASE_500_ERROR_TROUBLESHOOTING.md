# Supabase 500 Error Troubleshooting Guide

## 🚨 Error Description
Users are experiencing a 500 Internal Server Error when trying to sign up:
```
POST https://vmaiqmycljvglkptjbuz.supabase.co/auth/v1/signup 500 (Internal Server Error)
```

## 🔍 Root Causes & Solutions

### 1. **Supabase Project Configuration Issues**

#### **Check Supabase Dashboard Settings:**
- Go to your Supabase project dashboard
- Navigate to Authentication > Settings
- Verify the following settings:

**Site URL Configuration:**
```
Site URL: https://yourdomain.com (or http://localhost:3000 for development)
```

**Redirect URLs:**
```
http://localhost:3000/**
https://yourdomain.com/**
```

**Email Settings:**
- Ensure SMTP is configured if using email confirmations
- Check if email confirmations are enabled/disabled appropriately

### 2. **Database Schema Issues**

#### **Check Required Tables:**
Ensure these tables exist in your Supabase database:
```sql
-- Check if profiles table exists
SELECT * FROM information_schema.tables WHERE table_name = 'profiles';

-- If missing, create it:
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 3. **Authentication Triggers**

#### **Create User Profile Trigger:**
```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. **Rate Limiting Issues**

#### **Check Rate Limits:**
- Supabase has rate limits on auth endpoints
- If users are hitting limits, implement client-side throttling
- Consider implementing exponential backoff

### 5. **Email Configuration**

#### **SMTP Settings:**
If using email confirmations, ensure SMTP is properly configured:
- Go to Authentication > Settings > SMTP Settings
- Configure with a valid email service (SendGrid, Mailgun, etc.)
- Test email delivery

#### **Disable Email Confirmations (Temporary Fix):**
```
Authentication > Settings > Email Auth
Uncheck "Enable email confirmations"
```

### 6. **Client-Side Improvements**

#### **Enhanced Error Handling:**
The updated Signup.tsx now includes:
- Better error message parsing
- Client-side validation
- Specific error handling for common issues
- Improved user feedback

#### **Retry Logic:**
```typescript
const retrySignup = async (email: string, password: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (!error) return { data, error: null };
      
      // Don't retry on client errors
      if (error.status < 500) throw error;
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
};
```

## 🛠️ Immediate Actions

### 1. **Check Supabase Status**
- Visit https://status.supabase.com/
- Check if there are any ongoing issues

### 2. **Review Supabase Logs**
- Go to your Supabase dashboard
- Navigate to Logs > Auth
- Look for error patterns around signup attempts

### 3. **Test with Different Credentials**
- Try signing up with different email addresses
- Test with different password formats
- Check if the issue is user-specific or global

### 4. **Verify Environment Variables**
```bash
# Check your .env file
VITE_SUPABASE_URL=https://vmaiqmycljvglkptjbuz.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🔧 Code Improvements Made

### 1. **Enhanced Signup Component:**
- Added client-side validation
- Improved error handling with specific error messages
- Better user feedback with colored message boxes
- Proper redirect handling

### 2. **Error Message Types:**
- Success messages (green)
- Error messages (red)
- Info messages (blue)

### 3. **Validation Improvements:**
- Email format validation
- Password length validation
- Required field validation

## 📞 Next Steps

1. **Monitor the Error:**
   - Check if the improved error handling provides more specific error messages
   - Look for patterns in the error logs

2. **Test Different Scenarios:**
   - Try signing up with Google OAuth
   - Test with different email providers
   - Verify email confirmation flow

3. **Contact Supabase Support:**
   - If the issue persists, contact Supabase support with:
     - Project URL
     - Error logs
     - Steps to reproduce

4. **Consider Alternative Approaches:**
   - Implement a fallback signup method
   - Add more detailed logging
   - Consider implementing a queue system for signups

## 🚀 Prevention Measures

1. **Implement Monitoring:**
   - Set up error tracking (Sentry, LogRocket)
   - Monitor auth success/failure rates
   - Set up alerts for 500 errors

2. **Add Retry Logic:**
   - Implement exponential backoff
   - Add user-friendly retry buttons
   - Handle network timeouts gracefully

3. **Improve User Experience:**
   - Show loading states
   - Provide clear error messages
   - Offer alternative signup methods
