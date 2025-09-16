import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const NotificationDebugger: React.FC = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkDatabase = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Check if notifications table exists
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .limit(1);

      // Check if push_subscriptions table exists
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .limit(1);

      // Check if send_test_notification function exists
      const { data: testResult, error: testError } = await supabase
        .rpc('send_test_notification', {
          p_user_id: user.id,
          p_title: 'Debug Test',
          p_body: 'This is a debug test notification'
        });

      setDebugInfo({
        user_id: user.id,
        notifications_table: {
          exists: !notifError,
          error: notifError?.message,
          sample_data: notifications
        },
        push_subscriptions_table: {
          exists: !subError,
          error: subError?.message,
          sample_data: subscriptions
        },
        test_function: {
          exists: !testError,
          error: testError?.message,
          result: testResult
        }
      });

    } catch (error) {
      setDebugInfo({
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setDebugInfo({
        user_id: user.id,
        notifications: data,
        error: error?.message
      });

    } catch (error) {
      setDebugInfo({
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Please log in to debug notifications.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Notification Debugger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkDatabase} disabled={isLoading}>
              Check Database Setup
            </Button>
            <Button onClick={checkNotifications} disabled={isLoading} variant="outline">
              Check My Notifications
            </Button>
          </div>
          
          {debugInfo && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Debug Results:</h3>
              <pre className="text-sm bg-muted p-3 rounded overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationDebugger;
