'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string;
  avatar_url: string | null;
  created_at: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function sanitizeUsername(raw: string): string {
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return (cleaned || 'reader').slice(0, 30);
}

function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'FOL-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureFriendCode = useCallback(async (userId: string) => {
    const { data: existing } = await supabase
      .from('friend_codes')
      .select('code')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) return;

    for (let attempt = 0; attempt < 5; attempt++) {
      const { error } = await supabase
        .from('friend_codes')
        .insert({ user_id: userId, code: generateFriendCode() });

      if (!error) return;
      if (error.code !== '23505') break;
    }
  }, []);

  const ensureProfile = useCallback(async (authUser: User): Promise<Profile | null> => {
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existing) {
      setProfile(existing as Profile);
      await ensureFriendCode(authUser.id);
      return existing as Profile;
    }

    if (fetchError) {
      console.error('Profile fetch error:', fetchError);
    }

    const emailPrefix = authUser.email?.split('@')[0] ?? 'reader';
    const preferredUsername = typeof authUser.user_metadata?.username === 'string'
      ? authUser.user_metadata.username.trim()
      : '';
    const baseUsername = sanitizeUsername(preferredUsername || emailPrefix);
    const displayName = preferredUsername || emailPrefix;

    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = attempt === 0 ? '' : `_${Math.random().toString(36).slice(2, 6)}`;
      const username = `${baseUsername}${suffix}`.slice(0, 40);

      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          username,
          display_name: displayName,
          bio: '',
        })
        .select()
        .single();

      if (created) {
        await ensureFriendCode(authUser.id);
        setProfile(created as Profile);
        return created as Profile;
      }

      if (insertError?.code !== '23505') {
        console.error('Profile creation error:', insertError);
        break;
      }
    }

    setProfile(null);
    return null;
  }, [ensureFriendCode]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await ensureProfile(session.user);
      }
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await ensureProfile(session.user);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [ensureProfile]);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    // Step 1: Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (authError || !authData.user) {
      return { error: authError };
    }

    await ensureProfile(authData.user);

    return { error: null };
  }, [ensureProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user) {
      await ensureProfile(data.user);
    }
    return { error };
  }, [ensureProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await ensureProfile(user);
    }
  }, [user, ensureProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
