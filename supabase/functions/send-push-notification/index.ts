import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to create VAPID header (simplified JWT implementation)
async function createVapidHeader(endpoint: string, subject: string, publicKey: string, privateKey: string): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  // Create JWT header
  const header = {
    typ: 'JWT',
    alg: 'ES256'
  };
  
  // Create JWT payload
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    sub: subject
  };
  
  // Encode header and payload
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  // Create signature (simplified - in production use proper ES256 signing)
  const signature = btoa('simplified-signature').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const token = `${encodedHeader}.${encodedPayload}.${signature}`;
  
  return `vapid t=${token}, k=${publicKey}`;
}

// Helper function to encrypt payload (simplified implementation)
async function encryptPayload(payload: string, p256dh: Uint8Array, auth: Uint8Array): Promise<Uint8Array> {
  // This is a simplified implementation
  // In production, use proper ECDH encryption with the p256dh and auth keys
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(payload);
  
  // For now, just return the payload as-is
  // In production, this would involve:
  // 1. Generate a random salt
  // 2. Derive encryption keys using ECDH
  // 3. Encrypt the payload using AES-GCM
  // 4. Format according to RFC 8291
  
  return payloadBytes;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { user_id, title, body, type = 'system', metadata = {} } = await req.json()

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabaseClient
      .rpc('get_user_push_subscriptions', { p_user_id: user_id })

    if (subError) {
      console.error('Error getting subscriptions:', subError)
      return new Response(
        JSON.stringify({ error: 'Failed to get user subscriptions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No push subscriptions found for user' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Store notification in database
    const { error: notifError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        body,
        metadata
      })

    if (notifError) {
      console.error('Error storing notification:', notifError)
    }

    // Send push notifications to all user's devices
    const results = []
    for (const sub of subscriptions) {
      try {
        const payload = JSON.stringify({
          title,
          body,
          icon: '/og-image.png',
          badge: '/og-image.png',
          tag: `wordsmith-${type}`,
          data: { type, ...metadata },
          actions: [
            {
              action: 'open',
              title: 'Open App'
            },
            {
              action: 'close',
              title: 'Close'
            }
          ]
        })

        // Convert base64 keys back to Uint8Array
        const p256dh = Uint8Array.from(atob(sub.p256dh), c => c.charCodeAt(0))
        const auth = Uint8Array.from(atob(sub.auth), c => c.charCodeAt(0))

        // Create VAPID header
        const vapidHeader = await createVapidHeader(
          sub.endpoint,
          'mailto:admin@wordsmith.com',
          Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
          Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
        )

        // Encrypt payload (simplified - in production use proper ECDH)
        const encryptedPayload = await encryptPayload(payload, p256dh, auth)

        // Send push notification
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'Authorization': vapidHeader,
            'TTL': '86400'
          },
          body: encryptedPayload
        })

        if (!response.ok) {
          throw new Error(`Push notification failed: ${response.status}`)
        }

        results.push({ endpoint: sub.endpoint, success: true })
      } catch (error) {
        console.error('Error sending push to subscription:', sub.endpoint, error)
        results.push({ endpoint: sub.endpoint, success: false, error: error.message })
        
        // If subscription is invalid, remove it from database
        if (error.message.includes('410') || error.message.includes('404')) {
          await supabaseClient
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications sent',
        results,
        totalSent: results.filter(r => r.success).length,
        totalSubscriptions: subscriptions.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-push-notification function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
