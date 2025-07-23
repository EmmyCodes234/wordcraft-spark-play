// supabase/functions/notify-players/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "../_vendor/web-push.ts";

const VAPID_KEYS = {
  publicKey: Deno.env.get("VAPID_PUBLIC_KEY")!,
  privateKey: Deno.env.get("VAPID_PRIVATE_KEY")!,
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.json();
  const subscription = body.subscription;
  const payload = JSON.stringify({
    title: "Scrabble Tournament Update",
    body: body.message || "A new pairing or result has been posted!",
  });

  try {
    await webpush.sendNotification(subscription, payload, {
      vapidDetails: {
        subject: "mailto:admin@example.com",
        publicKey: VAPID_KEYS.publicKey,
        privateKey: VAPID_KEYS.privateKey,
      },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Push error:", err);
    return new Response(JSON.stringify({ error: "Failed to send notification" }), { status: 500 });
  }
});
