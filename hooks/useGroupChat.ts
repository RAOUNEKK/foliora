'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'recommendation' | 'goal_update';
  created_at: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

export function useGroupChat(groupId: string) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);

    // group_messages.user_id references auth.users, not profiles, so we
    // fetch messages first and then look up their profile information.
    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error || !data) {
      if (error) console.error('Failed to load group messages:', error);
      setMessages([]);
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set(data.map((message: any) => message.user_id)));
    let profilesById = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url, id')
        .in('id', userIds);

      if (profilesError) {
        console.error('Failed to load message author profiles:', profilesError);
      } else {
        profilesById = new Map(
          (profilesData || []).map((profile: any) => [profile.id, profile])
        );
      }
    }

    setMessages(
      data.map((message: any) => ({
        ...message,
        profile: profilesById.get(message.user_id),
      })) as GroupMessage[]
    );
    setLoading(false);
  }, [groupId]);

  // Keep a ref to the latest messages so the Realtime callback does not need
  // to recreate the subscription every time a message is added.
  const messagesRef = useRef<GroupMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`group_chat_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMessage = payload.new as GroupMessage;

          // Realtime also sends the INSERT back to the sender. Since sendMessage()
          // adds the message locally immediately, ignore it here if it already exists.
          const alreadyExists = messagesRef.current.some(
            (message) => message.id === newMessage.id
          );

          if (alreadyExists) return;

          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', newMessage.user_id)
            .maybeSingle();

          if (profileError) {
            console.error('Failed to load new message profile:', profileError);
          }

          setMessages((prev) => {
            // Check again inside the state update to avoid duplicates if two
            // realtime callbacks happen close together.
            if (prev.some((message) => message.id === newMessage.id)) {
              return prev;
            }

            return [
              ...prev,
              { ...newMessage, profile: profileData || undefined },
            ];
          });
        }
      )
      .subscribe((status) => {
        console.log(`Group chat Realtime status (${groupId}):`, status);
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [groupId, fetchMessages]);

  const sendMessage = useCallback(
    async (
      content: string,
      messageType: GroupMessage['message_type'] = 'text'
    ) => {
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return { data: null, error: null };
      }

      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          content: trimmedContent,
          message_type: messageType,
        })
        .select()
        .single();

      if (error || !data) {
        console.error('Failed to send message:', error);
        return { data: null, error };
      }

      // IMPORTANT: show the message immediately for the sender.
      // We do not wait for Supabase Realtime to echo it back.
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', data.user_id)
        .maybeSingle();

      if (profileError) {
        console.error('Failed to load sender profile:', profileError);
      }

      const newMessage: GroupMessage = {
        ...(data as GroupMessage),
        profile: profileData || undefined,
      };

      setMessages((prev) => {
        // Realtime may have already delivered this message before the INSERT
        // request finishes, so never add the same message twice.
        if (prev.some((message) => message.id === newMessage.id)) {
          return prev;
        }

        return [...prev, newMessage];
      });

      return { data: newMessage, error: null };
    },
    [groupId]
  );

  return {
    messages,
    loading,
    sendMessage,
    refresh: fetchMessages,
  };
}
