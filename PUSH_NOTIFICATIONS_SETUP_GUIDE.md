# Push Notifications Setup Guide

## 🔧 Environment Variables Setup

### 1. Create `.env` file in your project root:

```bash
# Copy this content to a new .env file
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# VAPID Keys for Push Notifications
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VITE_VAPID_PRIVATE_KEY=your_vapid_private_key_here
```

### 2. Generate VAPID Keys:

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
npx web-push generate-vapid-keys
```

This will output something like:
```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa40HI8F2j4v7g3L2c

Private Key:
your_private_key_here

=======================================
```

### 3. Update your `.env` file:

```bash
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa40HI8F2j4v7g3L2c
VITE_VAPID_PRIVATE_KEY=your_private_key_here
```

### 4. Update Supabase Edge Function Environment Variables:

In your Supabase dashboard:
1. Go to **Edge Functions**
2. Select **send-push-notification**
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `VAPID_PUBLIC_KEY` = your public key
   - `VAPID_PRIVATE_KEY` = your private key

### 5. Restart your development server:

```bash
npm run dev
# or
yarn dev
```

## 🚨 Important Notes:

- **Never commit** your `.env` file to version control
- **Use different keys** for development and production
- **Keep private keys secure** - they should never be exposed to the client
- **Test with real devices** - push notifications don't work in some development environments

## 🔍 Troubleshooting:

### Error: "VAPID public key not configured"
- Make sure your `.env` file exists in the project root
- Check that `VITE_VAPID_PUBLIC_KEY` is set correctly
- Restart your development server after adding the environment variable

### Error: "Service worker registration failed"
- Make sure `/sw-push.js` exists in your `public` folder
- Check browser console for specific service worker errors

### Error: "Push subscription failed"
- Verify VAPID keys are correctly formatted
- Check that the public key matches what's in your Edge Function
- Ensure the service worker is properly registered
