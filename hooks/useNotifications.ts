'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type:
    | 'follow'
    | 'unfollow'
    | 'follower_removed'
    | 'group_invite'
    | 'invite_accepted'
    | 'group_message'
    | 'goal_completed'
    | 'join_request'
    | 'join_request_response';
  title: string;
  message: string;
  data: Record<string, any> | null;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const setupRealtime = async () => {
      await fetchNotifications();

      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      channel = supabase
        .channel(`notifications_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;

            setNotifications((prev) => {
              if (prev.some((notification) => notification.id === newNotification.id)) {
                return prev;
              }
              return [newNotification, ...prev].slice(0, 50);
            });

            if (!newNotification.read) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .subscribe((status) => {
          console.log(`Notifications Realtime status (${user.id}):`, status);
        });
    };

    setupRealtime();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);
    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  }, []);

  /**
   * Accept a group invitation:
   * 1. Update group_invitations status → 'accepted'
   * 2. Insert into group_members
   * 3. Mark notification as read and remove from list
   */
  const acceptGroupInvite = useCallback(async (notification: Notification) => {
    const { invitation_id, group_id } = notification.data ?? {};
    if (!invitation_id || !group_id) return { error: new Error('Invalid notification data') };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    // Update invitation
    const { error: inviteError } = await supabase
      .from('group_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation_id)
      .eq('invitee_id', user.id);

    if (inviteError) return { error: inviteError };

    // Add to group_members
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id, user_id: user.id, role: 'member', status: 'active' });

    if (memberError && memberError.code !== '23505') { // ignore duplicate
      return { error: memberError };
    }

    // Remove notification from UI
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    return { error: null };
  }, []);

  /**
   * Reject a group invitation:
   * 1. Update group_invitations status → 'declined'
   * 2. Delete the notification
   */
  const rejectGroupInvite = useCallback(async (notification: Notification) => {
    const { invitation_id } = notification.data ?? {};
    if (!invitation_id) return { error: new Error('Invalid notification data') };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { error: inviteError } = await supabase
      .from('group_invitations')
      .update({ status: 'declined' })
      .eq('id', invitation_id)
      .eq('invitee_id', user.id);

    if (inviteError) return { error: inviteError };

    // Delete the notification
    await supabase.from('notifications').delete().eq('id', notification.id);
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    return { error: null };
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    acceptGroupInvite,
    rejectGroupInvite,
    refresh: fetchNotifications,
  };
}