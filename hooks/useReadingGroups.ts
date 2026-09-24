'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ReadingGroup {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  cover_url: string | null;
  reading_goal: string | null;
  is_private: boolean;
  created_at: string;
  member_count?: number;
  user_role?: 'creator' | 'admin' | 'member';
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'creator' | 'admin' | 'member';
  status: 'active' | 'left';
  joined_at: string;
  profile?: { username: string; display_name: string; avatar_url: string | null };
}

export async function deleteReadingGroup(groupId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  const { error } = await supabase
    .from('reading_groups')
    .delete()
    .eq('id', groupId)
    .eq('creator_id', user.id);

  return { error };
}

export interface GroupInvitation {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  group?: { name: string };
  inviter?: { username: string; display_name: string };
}

export interface GroupJoinRequest {
  id: string;
  group_id: string;
  requester_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  requester?: { username: string; display_name: string; avatar_url: string | null };
}

/** Request to join a public group. Rejected by RLS if the group is
 * private, already joined, or already requested (unique constraint). */
export async function requestToJoinGroup(groupId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: new Error('Not authenticated') };

  const { data, error } = await supabase
    .from('group_join_requests')
    .insert({ group_id: groupId, requester_id: user.id })
    .select()
    .single();
  return { data, error };
}

/** The current user's own pending join requests (to know which groups
 * already show "Request sent" instead of the request button). */
export async function getMyJoinRequests() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] as GroupJoinRequest[], error: null };

  const { data, error } = await supabase
    .from('group_join_requests')
    .select('*')
    .eq('requester_id', user.id)
    .eq('status', 'pending');
  return { data: (data || []) as GroupJoinRequest[], error };
}

/** Pending join requests for a group the current user created. */
export async function getJoinRequests(groupId: string) {
  const { data, error } = await supabase
    .from('group_join_requests')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'pending');

  if (error || !data) return { data: [] as GroupJoinRequest[], error };

  const requesterIds = Array.from(new Set(data.map((r: any) => r.requester_id)));
  let profilesById = new Map<string, any>();
  if (requesterIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', requesterIds);
    if (profilesError) {
      console.error('Failed to load requester profiles:', profilesError);
    } else {
      profilesById = new Map((profiles || []).map((p: any) => [p.id, p]));
    }
  }

  return {
    data: data.map((r: any) => ({ ...r, requester: profilesById.get(r.requester_id) })) as GroupJoinRequest[],
    error: null,
  };
}

/** Creator accepts or declines a join request. On accept, adds the
 * requester to group_members (allowed because the creator is doing
 * the insert — see group_members_insert_invited). */
export async function respondToJoinRequest(
  requestId: string,
  groupId: string,
  requesterId: string,
  response: 'accepted' | 'declined',
) {
  const { data, error } = await supabase
    .from('group_join_requests')
    .update({ status: response })
    .eq('id', requestId)
    .select()
    .single();

  if (!error && response === 'accepted') {
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: requesterId, role: 'member', status: 'active' });
    if (memberError) console.error('Accepted request but failed to add member:', memberError);
  }
  return { data, error };
}

/** Leave a group you belong to (not for the creator — they delete the
 * group instead, via deleteReadingGroup). */
export async function leaveGroup(groupId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: new Error('Not authenticated') };

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', user.id);
  return { error };
}

/** A single group's details, visible if it's public or the caller
 * already belongs to it (see get_group_details in the 013 migration). */
export async function getGroupDetails(groupId: string): Promise<{ data: ReadingGroup | null; error: any }> {
  const { data, error } = await supabase.rpc('get_group_details', { p_group_id: groupId });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: (row as ReadingGroup) || null, error: null };
}

/** All groups the current user belongs to (any role, active status). */
export function useMyGroups() {
  const [groups, setGroups] = useState<ReadingGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Fetch memberships → group details in one join
    const { data, error } = await supabase
      .from('group_members')
      .select('role, reading_groups(*)')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (!error && data) {
      const mapped: ReadingGroup[] = data.map((row: any) => ({
        ...row.reading_groups,
        user_role: row.role,
      }));
      setGroups(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const deleteGroup = useCallback(async (groupId: string) => {
    const { error } = await deleteReadingGroup(groupId);
    if (!error) setGroups((prev) => prev.filter((g) => g.id !== groupId));
    return { error };
  }, []);

  return { groups, loading, refresh: fetchGroups, deleteGroup };
}

/** Groups for a specific user (for public profile view). Uses a
 * SECURITY DEFINER RPC rather than a direct join: group_members' RLS
 * only lets you see rows involving yourself, so a plain join could
 * never show another user's memberships even for their public
 * groups — which is exactly the case this needs to support. */
export function useUserGroups(userId?: string) {
  const [groups, setGroups] = useState<ReadingGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    const { data, error } = await supabase.rpc('get_public_groups_for_user', { p_user_id: userId });
    if (error) {
      console.error('Failed to load public groups for user:', error);
    } else {
      setGroups((data || []) as ReadingGroup[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  return { groups, loading, refresh: fetchGroups };
}

/** All public groups on the platform, for a "browse/discover" list —
 * separate from useMyGroups, which only returns groups you belong to. */
export function useAllPublicGroups() {
  const [groups, setGroups] = useState<ReadingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc('get_all_public_groups');
    if (error) {
      console.error('Failed to load public groups:', error);
      setError(error);
    } else {
      setGroups((data || []) as ReadingGroup[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  return { groups, loading, error, refresh: fetchGroups };
}

export function useReadingGroups() {
  const [groups, setGroups] = useState<ReadingGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reading_groups')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setGroups(data as ReadingGroup[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  /**
   * Create a group and assign the creator as Group Admin in one RPC
   * so RLS on group_members cannot recurse mid-insert.
   */
  const createGroup = useCallback(async (group: {
    name: string;
    description: string;
    cover_url?: string;
    reading_goal?: string;
    is_private?: boolean;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase.rpc('create_reading_group', {
      p_name: group.name,
      p_description: group.description ?? '',
      p_reading_goal: group.reading_goal ?? null,
      p_cover_url: group.cover_url ?? null,
      p_is_private: group.is_private ?? true,
    });

    if (!error && data) {
      setGroups((prev) => [data as ReadingGroup, ...prev]);
    }
    return { data, error };
  }, []);

  const getGroupMembers = useCallback(async (groupId: string) => {
    // group_members.user_id references auth.users, not profiles directly,
    // so there's no FK for PostgREST to embed "profiles" through (same
    // issue as the followers list) — fetch members, then look up their
    // profiles separately and merge.
    const { data: memberRows, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'active');

    if (error || !memberRows) return { data: [] as GroupMember[], error };

    const userIds = Array.from(new Set(memberRows.map((m: any) => m.user_id)));
    let profilesById = new Map<string, any>();
    if (userIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
      if (profilesError) {
        console.error('Failed to load member profiles:', profilesError);
      } else {
        profilesById = new Map((profilesData || []).map((p: any) => [p.id, p]));
      }
    }

    const withProfiles = memberRows.map((m: any) => ({
      ...m,
      profile: profilesById.get(m.user_id),
    }));

    return { data: withProfiles as GroupMember[], error: null };
  }, []);

  /**
   * Invite a user by searching their username first, then inserting the invitation.
   * The DB trigger automatically creates a notification for the invitee.
   */
  const inviteMemberByUsername = useCallback(async (groupId: string, username: string) => {
    // Look up the user by username
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('username', username.trim().toLowerCase())
      .maybeSingle();

    if (profileError || !profileData) {
      return { data: null, error: new Error('User not found') };
    }

    // Check they're not already a member
    const { data: existingMember } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', profileData.id)
      .eq('status', 'active')
      .maybeSingle();

    if (existingMember) {
      return { data: null, error: new Error('User is already a member') };
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('group_invitations')
      .select('id')
      .eq('group_id', groupId)
      .eq('invitee_id', profileData.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvite) {
      return { data: null, error: new Error('Invitation already sent') };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    // Insert invitation — DB trigger fires notification automatically
    const { data, error } = await supabase
      .from('group_invitations')
      .insert({
        group_id: groupId,
        inviter_id: user.id,
        invitee_id: profileData.id,
      })
      .select()
      .single();

    return { data, error, invitee: profileData };
  }, []);

  /** Legacy invite by user ID (kept for backward compat) */
  const inviteMember = useCallback(async (groupId: string, inviteeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('group_invitations')
      .insert({ group_id: groupId, inviter_id: user.id, invitee_id: inviteeId })
      .select()
      .single();
    return { data, error };
  }, []);

  /**
   * Accept or decline an invitation.
   * On accept: inserts group_member row + marks notification as read.
   * On decline: just updates invitation status.
   */
  const respondToInvitation = useCallback(async (
    invitationId: string,
    response: 'accepted' | 'declined',
    notificationId?: string,
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('group_invitations')
      .update({ status: response })
      .eq('id', invitationId)
      .eq('invitee_id', user.id) // RLS: only invitee can respond
      .select()
      .single();

    if (!error && data) {
      if (response === 'accepted') {
        // Add to group_members
        await supabase.from('group_members').insert({
          group_id: data.group_id,
          user_id: user.id,
          role: 'member',
          status: 'active',
        });
      }
      // Mark the notification as read in both cases
      if (notificationId) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId);
      }
    }
    return { data, error };
  }, []);

  const getInvitations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };

    // group:group_id(name) is a real, direct FK (group_invitations.group_id
    // -> reading_groups.id) so PostgREST can embed it fine. inviter_id,
    // like the other *_id columns here, references auth.users rather than
    // profiles, so that embed is fetched separately below instead.
    const { data, error } = await supabase
      .from('group_invitations')
      .select('*, group:group_id(name)')
      .eq('invitee_id', user.id)
      .eq('status', 'pending');

    if (error || !data) return { data: [] as GroupInvitation[], error };

    const inviterIds = Array.from(new Set(data.map((row: any) => row.inviter_id)));
    let invitersById = new Map<string, any>();
    if (inviterIds.length > 0) {
      const { data: inviterProfiles, error: inviterError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', inviterIds);
      if (inviterError) {
        console.error('Failed to load inviter profiles:', inviterError);
      } else {
        invitersById = new Map((inviterProfiles || []).map((p: any) => [p.id, p]));
      }
    }

    const withInviters = data.map((row: any) => ({
      ...row,
      inviter: invitersById.get(row.inviter_id),
    }));

    return { data: withInviters as GroupInvitation[], error: null };
  }, []);

  /** Check if current user is admin/creator of a group */
  const isGroupAdmin = useCallback(async (groupId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    return data?.role === 'creator' || data?.role === 'admin';
  }, []);

  const deleteGroup = useCallback(async (groupId: string) => {
    const { error } = await deleteReadingGroup(groupId);
    if (!error) setGroups((prev) => prev.filter((g) => g.id !== groupId));
    return { error };
  }, []);

  return {
    groups,
    loading,
    createGroup,
    deleteGroup,
    leaveGroup,
    getGroupMembers,
    getGroupDetails,
    inviteMember,
    inviteMemberByUsername,
    respondToInvitation,
    getInvitations,
    getJoinRequests,
    respondToJoinRequest,
    isGroupAdmin,
    refresh: fetchGroups,
  };
}