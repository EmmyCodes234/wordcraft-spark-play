import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Send, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

const NotificationTestPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const testInAppNotification = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('send_test_notification', {
        p_user_id: user.id,
        p_title: 'Test In-App Notification',
        p_body: 'This is a test notification from WordSmith! Check the bell icon.'
      });
      
      if (error) {
        console.error('Error:', error);
        setLastResult({ success: false, error: error.message });
      } else {
        console.log('Success:', data);
        setLastResult({ success: true, data });
      }
    } catch (error) {
      console.error('Error:', error);
      setLastResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testPushNotification = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: user.id,
          title: 'Test Push Notification',
          body: 'This is a test push notification from WordSmith!',
          type: 'system',
          metadata: { test: true }
        }
      });
      
      if (error) {
        console.error('Error:', error);
        setLastResult({ success: false, error: error.message });
      } else {
        console.log('Success:', data);
        setLastResult({ success: true, data });
      }
    } catch (error) {
      console.error('Error:', error);
      setLastResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Not Logged In</h3>
            <p className="text-muted-foreground">
              Please log in to test notifications.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 space-y-8">
        <div className="text-center space-y-4">
          <Bell className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-4xl font-bold text-primary">
            Notification Test Center
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Test both in-app and push notifications for WordSmith.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* In-App Notification Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                In-App Notification Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will create a notification that appears in the bell icon dropdown.
                Check the navbar bell icon after sending.
              </p>
              <Button 
                onClick={testInAppNotification} 
                disabled={isLoading}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send In-App Test Notification
              </Button>
            </CardContent>
          </Card>

          {/* Push Notification Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Push Notification Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will send a browser push notification. Make sure you've enabled 
                push notifications in Settings first.
              </p>
              <Button 
                onClick={testPushNotification} 
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Push Test Notification
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {lastResult && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {lastResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <h3 className="font-semibold">
                    {lastResult.success ? 'Success!' : 'Error'}
                  </h3>
                </div>
                <pre className="text-sm bg-muted p-3 rounded overflow-auto">
                  {JSON.stringify(lastResult, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">1. Enable Push Notifications:</h4>
                <p className="text-sm text-muted-foreground">
                  Go to Settings → Push Notifications → Enable the toggle
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">2. Test In-App Notifications:</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Send In-App Test Notification" then check the bell icon in the navbar
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">3. Test Push Notifications:</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Send Push Test Notification" - you should see a browser notification
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPage;
