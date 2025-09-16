#!/usr/bin/env node

/**
 * Generate VAPID keys for push notifications
 * Run with: node generate-vapid-keys.js
 */

import webpush from 'web-push';

console.log('🔑 Generating VAPID keys for push notifications...\n');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('=======================================');
console.log('✅ VAPID Keys Generated Successfully!');
console.log('=======================================\n');

console.log('📋 Add these to your .env file:');
console.log('=======================================');
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VITE_VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('=======================================\n');

console.log('🔧 Add these to your Supabase Edge Function environment variables:');
console.log('=======================================');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('=======================================\n');

console.log('📝 Instructions:');
console.log('1. Copy the VITE_* keys to your .env file');
console.log('2. Copy the VAPID_* keys to your Supabase Edge Function settings');
console.log('3. Restart your development server');
console.log('4. Test push notifications in your app\n');

console.log('⚠️  Important:');
console.log('- Never commit your .env file to version control');
console.log('- Use different keys for development and production');
console.log('- Keep private keys secure');
