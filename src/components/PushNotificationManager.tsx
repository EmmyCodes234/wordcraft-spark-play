import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const PushNotificationManager: React.FC = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vapidConfigured, setVapidConfigured] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Check VAPID configuration
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      setVapidConfigured(!!vapidKey);
      
      // Check if already subscribed
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      setIsSubscribed(data && data.length > 0);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) return;
    
    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await subscribeToPush();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPush = async () => {
    if (!user) return;
    
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw-push.js');
      console.log('Service worker registered:', registration);
      
      // Convert VAPID public key to Uint8Array
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        const errorMsg = 'VAPID public key not configured. Please check the setup guide.';
        console.error(errorMsg);
        alert(errorMsg + '\n\nSee PUSH_NOTIFICATIONS_SETUP_GUIDE.md for instructions.');
        throw new Error(errorMsg);
      }
      
      const applicationServerKey = Uint8Array.from(
        atob(vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/')),
        c => c.charCodeAt(0)
      );

      // Get push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      
      // Send subscription to server
      const { error } = await supabase.rpc('store_push_subscription', {
        p_endpoint: subscription.endpoint,
        p_p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
        p_auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
        p_user_agent: navigator.userAgent
      });
      
      if (error) {
        console.error('Error storing subscription:', error);
        return;
      }
      
      setIsSubscribed(true);
      console.log('Push subscription successful');
      
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!user) return;
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
      
      // Remove from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);
      
      setIsSubscribed(false);
      console.log('Push subscription removed');
      
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Push Notifications Not Supported</h3>
          <p className="text-muted-foreground">
            Your browser doesn't support push notifications. Please use a modern browser.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!vapidConfigured && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ VAPID keys not configured. See <code className="bg-yellow-100 px-1 rounded">PUSH_NOTIFICATIONS_SETUP_GUIDE.md</code> for setup instructions.
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable Push Notifications</p>
            <p className="text-sm text-muted-foreground">
              Get notified about new posts, comments, and updates
            </p>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={isSubscribed ? unsubscribeFromPush : requestPermission}
            disabled={isLoading || permission === 'denied' || !vapidConfigured}
          />
        </div>
        
        {permission === 'denied' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">
              Push notifications are blocked. Please enable them in your browser settings.
            </p>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Status: {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Not requested'}
        </div>
      </CardContent>
    </Card>
  );
};

export default PushNotificationManager;
