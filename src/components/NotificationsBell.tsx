import React, { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

type Notification = {
  id: string;
  title: string | null;
  body: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
};

const NotificationsBell: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, type, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setItems(data || []);
      setUnread((data || []).filter((n) => !n.is_read).length);
    };

    load();

    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev].slice(0, 20));
          setUnread((u) => u + (n.is_read ? 0 : 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-medium">Notifications</div>
          <Button size="sm" variant="ghost" onClick={markAllRead} className="gap-1">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        </div>
        <div className="max-h-80 overflow-auto">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4">No notifications yet</div>
          ) : (
            items.map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b ${n.is_read ? 'bg-white' : 'bg-accent/30'}`}>
                {n.title && <div className="text-sm font-medium">{n.title}</div>}
                {n.body && <div className="text-sm text-muted-foreground">{n.body}</div>}
                <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;


