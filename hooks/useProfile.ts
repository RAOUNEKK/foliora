'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/context/AuthContext';

export interface FullProfile extends Profile {
  friend_code: string | null;
  follower_count: number;
  following_count: number;
}

export function useProfile(username: string) {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    if (!profileData) {
      setError('Profile not found');
      setLoading(false);
      return;
    }

    const { data: codeData } = await supabase
      .from('friend_codes')
      .select('code')
      .eq('user_id', profileData.id)
      .maybeSingle();

    const { data: followerCount } = await supabase
      .rpc('get_follower_count', { user_uuid: profileData.id });

    const { data: followingCount } = await supabase
      .rpc('get_following_count', { user_uuid: profileData.id });

    setProfile({
      ...profileData,
      friend_code: codeData?.code || null,
      follower_count: followerCount || 0,
      following_count: followingCount || 0,
    });
    setLoading(false);
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refresh: fetchProfile };
}

export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    setLoading(false);
    if (error) {
      setError(error.message);
      return null;
    }
    return data as Profile;
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return null;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setLoading(false);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)
      .select()
      .single();

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return null;
    }
    return data as Profile;
  }, []);

  return { updateProfile, uploadAvatar, loading, error };
}
