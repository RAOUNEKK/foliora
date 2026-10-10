'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ArrowLeft, MessageCircle, LogOut, Trash2, UserPlus, Check, XCircle,
  Crown, Shield, Lock, Globe, Loader2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { GroupChat } from '@/components/GroupChat';
import { useAuth } from '@/context/AuthContext';
import {
  useReadingGroups, requestToJoinGroup, getMyJoinRequests,
  type ReadingGroup, type GroupMember, type GroupJoinRequest,
} from '@/hooks/useReadingGroups';
import { supabase } from '@/lib/supabase';

export default function GroupDetailPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const {
    getGroupDetails, getGroupMembers, getJoinRequests, respondToJoinRequest,
    leaveGroup, deleteGroup, inviteMemberByUsername,
  } = useReadingGroups();

  const [group, setGroup] = useState<ReadingGroup | null>(null);
  const [creator, setCreator] = useState<{ username: string; display_name: string; avatar_url: string | null } | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inaccessible, setInaccessible] = useState(false);

  const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
  const [myRequestPending, setMyRequestPending] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showChat, setShowChat] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isCreator = !!user && !!group && user.id === group.creator_id;
  const isMember = !!user && members.some((m) => m.user_id === user.id);

  const load = useCallback(async () => {
    setLoading(true);
    setInaccessible(false);
    setLoadError(null);

    const { data: groupData, error: groupError } = await getGroupDetails(params.groupId);
    if (groupError) {
      // A real query failure (e.g. a migration that hasn't been pushed yet,
      // so get_group_details doesn't exist) is not the same thing as "this
      // group is private" — show what actually went wrong instead of
      // guessing at a business reason.
      console.error('Failed to load group:', groupError);
      setLoadError((groupError as any).message || (groupError as any).details || 'Unknown error — check the console.');
      setInaccessible(true);
      setLoading(false);
      return;
    }
    if (!groupData) {
      setInaccessible(true);
      setLoading(false);
      return;
    }
    setGroup(groupData);

    const { data: creatorData } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', groupData.creator_id)
      .maybeSingle();
    setCreator(creatorData || null);

    const { data: memberData } = await getGroupMembers(params.groupId);
    setMembers(memberData);

    const amMember = !!user && memberData.some((m) => m.user_id === user.id);
    const amCreator = !!user && user.id === groupData.creator_id;

    if (amCreator) {
      const { data: requests } = await getJoinRequests(params.groupId);
      setJoinRequests(requests);
    } else if (!amMember && user) {
      const { data: myRequests } = await getMyJoinRequests();
      setMyRequestPending(myRequests.some((r) => r.group_id === params.groupId));
    }

    setLoading(false);
  }, [params.groupId, user, getGroupDetails, getGroupMembers, getJoinRequests]);

  useEffect(() => { load(); }, [load]);

  const handleRequestJoin = async () => {
    setRequesting(true);
    setActionError(null);
    const { error } = await requestToJoinGroup(params.groupId);
    setRequesting(false);
    if (error) {
      setActionError((error as any).message || 'Could not send the request.');
      return;
    }
    setMyRequestPending(true);
  };

  const handleRespondToRequest = async (req: GroupJoinRequest, response: 'accepted' | 'declined') => {
    const { error } = await respondToJoinRequest(req.id, params.groupId, req.requester_id, response);
    if (error) {
      console.error('Failed to respond to join request:', error);
      return;
    }
    setJoinRequests((prev) => prev.filter((r) => r.id !== req.id));
    if (response === 'accepted') load();
  };

  const handleLeave = async () => {
    setActioning(true);
    setActionError(null);
    const { error } = await leaveGroup(params.groupId);
    setActioning(false);
    if (error) {
      setActionError((error as any).message || 'Could not leave the group.');
      return;
    }
    router.push('/groups');
  };

  const handleDelete = async () => {
    setActioning(true);
    setActionError(null);
    const { error } = await deleteGroup(params.groupId);
    setActioning(false);
    if (error) {
      setActionError((error as any).message || 'Could not delete the group.');
      return;
    }
    router.push('/groups');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteUsername.trim()) return;
    setInviting(true);
    setInviteStatus(null);
    const { error } = await inviteMemberByUsername(params.groupId, inviteUsername.trim());
    setInviting(false);
    if (error) {
      setInviteStatus((error as any).message || 'Could not send the invite.');
      return;
    }
    setInviteStatus(`Invite sent to @${inviteUsername.trim()}`);
    setInviteUsername('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0602' }}>
        <Loader2 className="animate-spin text-gold-DEFAULT" size={28} />
      </div>
    );
  }

  if (inaccessible || !group) {
    return (
      <div className="min-h-screen" style={{ background: '#0a0602' }}>
        <Navbar />
        <div className="pt-32 text-center px-4">
          <Lock className="mx-auto mb-4 text-cream-400/30" size={32} />
          <p className="text-cream-200 text-lg mb-2" style={{ fontFamily: 'Cinzel' }}>
            {loadError ? 'Could not load this group' : 'This group is private'}
          </p>
          <p className="text-cream-400/50 text-sm mb-2" style={{ fontFamily: 'EB Garamond' }}>
            {loadError || 'Only its creator and members can see it.'}
          </p>
          {loadError && (
            <p className="text-cream-400/30 text-xs mb-4" style={{ fontFamily: 'EB Garamond' }}>
              This usually means a database migration hasn&apos;t been pushed yet.
            </p>
          )}
          <button
            onClick={() => router.push('/groups')}
            className="text-gold-DEFAULT/80 hover:text-gold-DEFAULT text-sm"
            style={{ fontFamily: 'Cinzel' }}
          >
            ← Back to Reading Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0602' }}>
      <Navbar />

      <section className="pt-28 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,12,4,1) 0%, rgba(10,6,2,1) 100%)' }} />
        <div className="relative max-w-4xl mx-auto">

          <button
            onClick={() => router.push('/groups')}
            className="flex items-center gap-2 text-cream-400/50 hover:text-cream-200 text-sm mb-6 transition-colors"
            style={{ fontFamily: 'Cinzel' }}
          >
            <ArrowLeft size={14} /> All Groups
          </button>

          {/* Header */}
          <motion.div
            className="rounded-2xl p-6 md:p-8 mb-6"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(218,165,32,0.15)' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1a3a1a)' }}>
                  <Users size={28} className="text-gold-DEFAULT" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl text-cream-100 mb-1" style={{ fontFamily: 'Cinzel', letterSpacing: '0.03em' }}>
                    {group.name}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-cream-400/40 mb-2">
                    {group.is_private ? <Lock size={12} /> : <Globe size={12} />}
                    <span style={{ fontFamily: 'Cinzel' }}>{group.is_private ? 'Private group' : 'Public group'}</span>
                    <span>·</span>
                    <span>{members.length || (isMember || isCreator ? 1 : '?')} members</span>
                  </div>
                  {creator && (
                    <a
                      href={`/profile/${creator.username}`}
                      className="inline-flex items-center gap-1.5 text-xs text-gold-DEFAULT/70 hover:text-gold-DEFAULT transition-colors"
                      style={{ fontFamily: 'EB Garamond' }}
                    >
                      <Crown size={12} />
                      Created by {creator.display_name || creator.username}
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {(isMember || isCreator) && (
                  <button
                    onClick={() => setShowChat(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm btn-enchanted text-wood-900 font-semibold"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    <MessageCircle size={14} /> Chat
                  </button>
                )}
                {isCreator && (
                  <button
                    onClick={() => setShowInvite((s) => !s)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gold-DEFAULT/80 hover:text-gold-DEFAULT transition-colors"
                    style={{ fontFamily: 'Cinzel', border: '1px solid rgba(218,165,32,0.25)' }}
                  >
                    <UserPlus size={14} /> Invite
                  </button>
                )}
                {isMember && !isCreator && (
                  <button
                    type="button"
                    onClick={() => setConfirmLeave(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-cream-400/60 hover:text-red-400 transition-colors"
                    style={{ fontFamily: 'Cinzel', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <LogOut size={14} /> Leave
                  </button>
                )}
                {isCreator && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-red-400/70 hover:text-red-400 transition-colors"
                    style={{ fontFamily: 'Cinzel', border: '1px solid rgba(239,68,68,0.25)' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
                {!isMember && !isCreator && !group.is_private && (
                  <button
                    type="button"
                    disabled={myRequestPending || requesting}
                    onClick={handleRequestJoin}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    style={{
                      fontFamily: 'Cinzel',
                      background: myRequestPending ? 'transparent' : undefined,
                      border: myRequestPending ? '1px solid rgba(218,165,32,0.25)' : undefined,
                      color: myRequestPending ? 'rgba(218,165,32,0.7)' : undefined,
                    }}
                  >
                    {myRequestPending ? (
                      'Request sent'
                    ) : (
                      <span className="btn-enchanted px-4 py-2 rounded-xl text-wood-900 flex items-center gap-1.5">
                        <UserPlus size={14} /> {requesting ? 'Requesting…' : 'Request to Join'}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {group.description && (
              <p className="text-cream-400/60 text-sm mt-4 italic" style={{ fontFamily: 'EB Garamond' }}>
                {group.description}
              </p>
            )}
            {group.reading_goal && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-cream-300" style={{ background: 'rgba(218,165,32,0.08)', fontFamily: 'EB Garamond' }}>
                📖 {group.reading_goal}
              </div>
            )}
            {actionError && (
              <p className="text-red-400 text-xs mt-3" style={{ fontFamily: 'EB Garamond' }}>{actionError}</p>
            )}
          </motion.div>

          {/* Invite form */}
          <AnimatePresence>
            {isCreator && showInvite && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl p-5 mb-6 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(218,165,32,0.15)' }}
              >
                <form onSubmit={handleInvite} className="flex gap-2">
                  <input
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="username to invite"
                    className="flex-1 bg-transparent border rounded-xl px-4 py-2.5 text-cream-100 text-sm input-gold"
                    style={{ borderColor: 'rgba(218,165,32,0.2)', fontFamily: 'EB Garamond' }}
                  />
                  <button
                    type="submit"
                    disabled={inviting}
                    className="btn-enchanted px-5 py-2.5 rounded-xl text-wood-900 font-semibold text-sm disabled:opacity-50"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    {inviting ? 'Sending…' : 'Send'}
                  </button>
                </form>
                {inviteStatus && (
                  <p className="text-cream-400/60 text-xs mt-2" style={{ fontFamily: 'EB Garamond' }}>{inviteStatus}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending join requests — creator only */}
          {isCreator && joinRequests.length > 0 && (
            <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(218,165,32,0.15)' }}>
              <h3 className="text-cream-100 text-sm font-semibold mb-3" style={{ fontFamily: 'Cinzel' }}>
                Join Requests
              </h3>
              <div className="space-y-2">
                {joinRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="text-cream-200 text-sm" style={{ fontFamily: 'EB Garamond' }}>
                      {req.requester?.display_name || req.requester?.username || 'Someone'}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleRespondToRequest(req, 'accepted')} className="p-2 rounded-lg text-green-400 hover:bg-green-800/20 transition-colors">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleRespondToRequest(req, 'declined')} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members */}
          {(isMember || isCreator) ? (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(218,165,32,0.15)' }}>
              <h3 className="text-cream-100 text-sm font-semibold mb-3" style={{ fontFamily: 'Cinzel' }}>
                Members
              </h3>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs" style={{ background: 'linear-gradient(135deg,#1e3a5f,#1a3a1a)', fontFamily: 'Cinzel', color: 'rgba(220,210,190,0.6)' }}>
                      {m.profile?.avatar_url ? (
                        <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (m.profile?.display_name || m.profile?.username || '?').charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="flex-1 text-cream-200 text-sm truncate" style={{ fontFamily: 'EB Garamond' }}>
                      {m.profile?.display_name || m.profile?.username || 'Unknown'}
                    </span>
                    {m.role === 'creator' && <Crown size={13} className="text-gold-DEFAULT shrink-0" />}
                    {m.role === 'admin' && <Shield size={13} className="text-cream-400/50 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-cream-400/40 text-sm text-center py-6 italic" style={{ fontFamily: 'EB Garamond' }}>
              Join this group to see its members and chat.
            </p>
          )}
        </div>
      </section>

      {/* Chat overlay */}
      <AnimatePresence>
        {showChat && (
          <GroupChat groupId={group.id} groupName={group.name} onClose={() => setShowChat(false)} />
        )}
      </AnimatePresence>

      {/* Leave confirmation */}
      <AnimatePresence>
        {confirmLeave && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => !actioning && setConfirmLeave(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#110d06', border: '1px solid rgba(218,165,32,0.2)' }}
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-cream-100 text-base mb-2" style={{ fontFamily: 'Cinzel' }}>Leave group</h3>
              <p className="text-cream-400/70 text-sm mb-5" style={{ fontFamily: 'EB Garamond' }}>
                Leave &ldquo;{group.name}&rdquo;? You can request to join again later if it&apos;s public, or need a new invite otherwise.
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" disabled={actioning} onClick={() => setConfirmLeave(false)} className="px-4 py-2 rounded-xl text-sm text-cream-200 border border-white/10 bg-white/5 disabled:opacity-40" style={{ fontFamily: 'Cinzel' }}>Cancel</button>
                <button type="button" disabled={actioning} onClick={handleLeave} className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ fontFamily: 'Cinzel', background: 'rgba(185,28,28,0.85)' }}>
                  {actioning ? 'Leaving…' : 'Leave'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => !actioning && setConfirmDelete(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#110d06', border: '1px solid rgba(218,165,32,0.2)' }}
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-cream-100 text-base mb-2" style={{ fontFamily: 'Cinzel' }}>Delete group</h3>
              <p className="text-cream-400/70 text-sm mb-5" style={{ fontFamily: 'EB Garamond' }}>
                Delete &ldquo;{group.name}&rdquo;? Members, invitations, and messages will be removed. This cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" disabled={actioning} onClick={() => setConfirmDelete(false)} className="px-4 py-2 rounded-xl text-sm text-cream-200 border border-white/10 bg-white/5 disabled:opacity-40" style={{ fontFamily: 'Cinzel' }}>Cancel</button>
                <button type="button" disabled={actioning} onClick={handleDelete} className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ fontFamily: 'Cinzel', background: 'rgba(185,28,28,0.85)' }}>
                  {actioning ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
