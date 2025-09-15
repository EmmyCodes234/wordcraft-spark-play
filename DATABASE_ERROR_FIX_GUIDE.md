# 🚨 Database Error Saving New User - Complete Fix Guide

## **Problem Description**
Users are experiencing database errors when trying to sign up. The error occurs because:
1. The `profiles` table doesn't exist or isn't properly configured
2. Database triggers aren't set up to auto-create user profiles
3. RLS (Row Level Security) policies are missing or misconfigured
4. The AuthContext tries to fetch a profile that doesn't exist

## **🔧 Immediate Fix (Run This SQL)**

### **Step 1: Run the Database Fix Script**
Go to your Supabase SQL Editor and run the contents of `FIX_USER_DATABASE_ERROR.sql`:

```sql
-- This will create all necessary tables, triggers, and policies
-- Copy and paste the entire contents of FIX_USER_DATABASE_ERROR.sql
```

### **Step 2: Verify the Fix**
1. Go to `/db-verify` in your app
2. Click "Run Database Tests"
3. All tests should show green checkmarks

## **🛠️ What the Fix Does**

### **1. Creates Required Tables:**
```sql
-- Profiles table for user information
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  user_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stats table for game statistics
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  total_words_played INTEGER DEFAULT 0,
  total_games_won INTEGER DEFAULT 0,
  -- ... other stats
);
```

### **2. Sets Up Row Level Security:**
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can create their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### **3. Creates Auto-Profile Creation Triggers:**
```sql
-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, avatar_url, user_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'USER_' || substr(NEW.id::text, 1, 8) || '_' || extract(epoch from now())::text
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
```

## **🔍 Code Improvements Made**

### **1. Enhanced AuthContext:**
- Added fallback profile creation if profile doesn't exist
- Better error handling and logging
- Automatic retry mechanism

### **2. Database Verification Tool:**
- New component at `/db-verify` to test database setup
- Real-time testing of tables, triggers, and policies
- Helpful error messages and next steps

### **3. Improved Error Handling:**
- Specific error messages for different failure scenarios
- Better user feedback during signup process
- Console logging for debugging

## **📋 Testing Steps**

### **1. Test New User Signup:**
1. Go to `/signup`
2. Enter a new email and password
3. Click "Sign Up"
4. Should see success message and redirect to dashboard

### **2. Test Profile Creation:**
1. After signup, go to `/profile`
2. Should see user profile with username from email
3. No database errors in console

### **3. Test Database Verification:**
1. Go to `/db-verify`
2. Click "Run Database Tests"
3. All tests should pass (green checkmarks)

## **🚨 Common Issues & Solutions**

### **Issue 1: "Profiles table does not exist"**
**Solution:** Run the SQL script in Supabase SQL Editor

### **Issue 2: "Permission denied"**
**Solution:** Check RLS policies are created correctly

### **Issue 3: "Trigger not working"**
**Solution:** Verify triggers are created and enabled

### **Issue 4: "Profile not found after signup"**
**Solution:** Check if trigger function is working, use manual profile creation as fallback

## **🔧 Manual Profile Creation (Fallback)**

If triggers don't work, users can manually create profiles:

1. Go to `/db-verify`
2. Click "Create Test Profile"
3. This will create a profile for the current user

## **📊 Monitoring & Debugging**

### **1. Check Supabase Logs:**
- Go to Supabase Dashboard > Logs > Auth
- Look for errors during signup attempts

### **2. Use Database Verification Tool:**
- Regular testing with `/db-verify`
- Monitor for any failing tests

### **3. Console Logging:**
- Check browser console for detailed error messages
- AuthContext now logs all profile creation attempts

## **🎯 Expected Results After Fix**

✅ **New users can sign up without database errors**  
✅ **Profiles are automatically created for new users**  
✅ **User stats are initialized for new users**  
✅ **RLS policies protect user data**  
✅ **Fallback mechanisms handle edge cases**  
✅ **Comprehensive error reporting and debugging tools**

## **🚀 Prevention Measures**

1. **Regular Database Health Checks:**
   - Use `/db-verify` regularly
   - Monitor Supabase logs

2. **Backup Triggers:**
   - AuthContext has fallback profile creation
   - Manual profile creation tool available

3. **Error Monitoring:**
   - Console logging for all database operations
   - User-friendly error messages

The database error should now be completely resolved! 🎉
