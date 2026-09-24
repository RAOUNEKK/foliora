'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/context/AuthContext';

export function useFollowers(userId?: string) {
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    // Fetch the raw relationship rows first, then the matching profiles in
    // a second query — followers.follower_id/following_id reference
    // auth.users, not profiles, so there is no real "profiles!followers_..."
    // foreign key for PostgREST to embed through. That embed silently
    // errored out on every call, which is why counts (computed by a
    // separate SECURITY DEFINER function) were correct while these lists
    // always came back empty.
    const [followerRes, followingRes] = await Promise.all([
      supabase.from('followers').select('follower_id').eq('following_id', userId),
      supabase.from('followers').select('following_id').eq('follower_id', userId),
    ]);

    if (followerRes.error) console.error('Failed to load followers:', followerRes.error);
    if (followingRes.error) console.error('Failed to load following:', followingRes.error);

    const followerIds = (followerRes.data || []).map((r: any) => r.follower_id as string);
    const followingIds = (followingRes.data || []).map((r: any) => r.following_id as string);
    const allIds = Array.from(new Set([...followerIds, ...followingIds]));

    if (allIds.length === 0) {
      setFollowers([]);
      setFollowing([]);
      setLoading(false);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', allIds);

    if (profilesError) {
      console.error('Failed to load profiles for follow lists:', profilesError);
      setFollowers([]);
      setFollowing([]);
    } else {
      const byId = new Map((profilesData || []).map((p: any) => [p.id, p]));
      setFollowers(followerIds.map((id) => byId.get(id)).filter(Boolean) as Profile[]);
      setFollowing(followingIds.map((id) => byId.get(id)).filter(Boolean) as Profile[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  return { followers, following, loading, refresh: fetchLists };
}

export function useFollowActions() {
  const [loading, setLoading] = useState(false);

  const getCurrentUserId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  /** Follow a user. Automatically accepted — no approval needed. */
  const follow = useCallback(async (targetUserId: string) => {
    setLoading(true);
    const currentId = await getCurrentUserId();
    if (!currentId) { setLoading(false); return { error: new Error('Not authenticated') }; }

    const { error } = await supabase
      .from('followers')
      .insert({ follower_id: currentId, following_id: targetUserId });
    setLoading(false);
    return { error };
  }, []);

  /** Unfollow a user. Must match both follower_id AND following_id. */
  const unfollow = useCallback(async (targetUserId: string) => {
    setLoading(true);
    const currentId = await getCurrentUserId();
    if (!currentId) { setLoading(false); return { error: new Error('Not authenticated') }; }

    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', currentId)
      .eq('following_id', targetUserId);
    setLoading(false);
    return { error };
  }, []);

  /** Remove a follower from your own followers list. */
  const removeFollower = useCallback(async (followerId: string) => {
    setLoading(true);
    const currentId = await getCurrentUserId();
    if (!currentId) { setLoading(false); return { error: new Error('Not authenticated') }; }

    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', currentId);
    setLoading(false);
    return { error };
  }, []);

  const isFollowing = useCallback(async (targetUserId: string): Promise<boolean> => {
    const currentId = await getCurrentUserId();
    if (!currentId) return false;
    const { data } = await supabase
      .rpc('is_following', { follower: currentId, following: targetUserId });
    return !!data;
  }, []);

  return { follow, unfollow, removeFollower, isFollowing, loading };
}