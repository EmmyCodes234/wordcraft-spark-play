// Source: https://deno.land/x/webpush@v0.1.0/mod.ts (flattened to avoid external imports)

const encoder = new TextEncoder();

export function generateVAPIDKeys() {
  const keyPair = crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"],
  );

  return keyPair.then(async (keys) => {
    const exported = await crypto.subtle.exportKey("raw", keys.publicKey);
    const exportedPrivate = await crypto.subtle.exportKey("pkcs8", keys.privateKey);
    return {
      publicKey: btoa(String.fromCharCode(...new Uint8Array(exported))),
      privateKey: btoa(String.fromCharCode(...new Uint8Array(exportedPrivate))),
    };
  });
}

export async function sendNotification(
  subscription: any,
  payload: string,
  options: {
    vapidDetails: {
      subject: string;
      publicKey: string;
      privateKey: string;
    };
  },
) {
  const endpoint = subscription.endpoint;
  const headers = {
    "Content-Type": "application/json",
    // Add VAPID logic here (mocked for now)
    Authorization: "vapid-auth-header-placeholder",
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: payload,
  });

  if (!response.ok) {
    throw new Error(`Push failed: ${response.statusText}`);
  }

  return response;
}

export function getVAPIDHeaders() {
  return {
    Authorization: "vapid-auth-header-placeholder",
  };
}

export default {
  generateVAPIDKeys,
  sendNotification,
  getVAPIDHeaders,
};
