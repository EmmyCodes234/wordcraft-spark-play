import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

type Notification = {
  id: string;
  title: string | null;
  body: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
};

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, title, body, type, is_read, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error loading notifications:', error);
          return;
        }

        setNotifications(data || []);
        setUnreadCount((data || []).filter((n) => !n.is_read).length);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        },
        (payload: any) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
          setUnreadCount((prev) => prev + (newNotification.is_read ? 0 : 1));
        }
      )
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        },
        (payload: any) => {
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) => 
            prev.map((n) => n.id === updatedNotification.id ? updatedNotification : n)
          );
          setUnreadCount((prev) => 
            prev - (payload.old.is_read ? 0 : 1) + (updatedNotification.is_read ? 0 : 1)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking notifications as read:', error);
        return;
      }

      // Update local state
      setNotifications((prev) => 
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Update local state
      setNotifications((prev) => 
        prev.map((n) => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'system': return '🔔';
      case 'user_post': return '📝';
      case 'post_commented': return '💬';
      case 'post_reacted': return '❤️';
      case 'friend_request': return '👥';
      case 'achievement': return '🏆';
      default: return '🔔';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to view notifications.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background transition-colors duration-300 ${isMobile ? 'mobile-container' : 'container mx-auto px-4'}`}>
      <div className={`py-6 ${isMobile ? 'px-4' : 'px-0'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="mobile-haptic"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className={`font-bold text-primary ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
                Notifications
              </h1>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              size="sm"
              className="mobile-button"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                <p className="text-muted-foreground">
                  You'll see notifications here when you receive them.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`mobile-card transition-all duration-200 ${
                  !notification.is_read ? 'border-primary/20 bg-primary/5' : ''
                }`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {notification.title && (
                            <h3 className={`font-semibold text-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
                              {notification.title}
                            </h3>
                          )}
                          {notification.body && (
                            <p className={`text-muted-foreground mt-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                              {notification.body}
                            </p>
                          )}
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {notification.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
