'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Shield, Plus, Search, X, Loader2, Send, Trash2, UserPlus, Lock, Globe } from 'lucide-react';
import {
  useUserGroups, useMyGroups, useReadingGroups, deleteReadingGroup,
  requestToJoinGroup, getMyJoinRequests, type ReadingGroup,
} from '@/hooks/useReadingGroups';

interface GroupsTabProps {
  userId: string;
  isOwnProfile: boolean;
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'creator') return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
      style={{ background: 'rgba(218,165,32,0.15)', color: '#daa520', fontFamily: 'Cinzel, serif' }}>
      <Crown size={9} /> Admin
    </span>
  );
  if (role === 'admin') return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
      style={{ background: 'rgba(61,140,61,0.15)', color: '#3d8c3d', fontFamily: 'Cinzel, serif' }}>
      <Shield size={9} /> Admin
    </span>
  );
  return null;
}

interface InviteModalProps {
  group: ReadingGroup;
  onClose: () => void;
}

function InviteModal({ group, onClose }: InviteModalProps) {
  const { inviteMemberByUsername } = useReadingGroups();
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setStatus(null);
    const { error, invitee } = await inviteMemberByUsername(group.id, username) as any;
    setLoading(false);
    if (error) {
      setStatus({ type: 'error', message: error.message });
    } else {
      setStatus({ type: 'success', message: `Invitation sent to @${invitee?.username}` });
      setUsername('');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#110d06', border: '1px solid rgba(218,165,32,0.2)' }}
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-cream-100 text-base" style={{ fontFamily: 'Cinzel, serif' }}>
              Invite to Group
            </h3>
            <p className="text-gold-DEFAULT/50 text-xs mt-0.5" style={{ fontFamily: 'EB Garamond, serif' }}>
              {group.name}
            </p>
          </div>
          <button onClick={onClose} className="text-cream-400/40 hover:text-cream-300 transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-cream-400/60 text-sm mb-4" style={{ fontFamily: 'EB Garamond, serif' }}>
          Enter the username of the person you want to invite. They will receive a notification.
        </p>

        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(218,165,32,0.15)' }}
        >
          <Search size={15} className="text-gold-DEFAULT/40 shrink-0" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            placeholder="username"
            className="flex-1 bg-transparent text-cream-100 text-sm placeholder-cream-400/30 outline-none"
            style={{ fontFamily: 'EB Garamond, serif' }}
            autoFocus
          />
        </div>

        {status && (
          <p
            className={`text-xs mb-3 ${status.type === 'success' ? 'text-forest-400' : 'text-red-400/80'}`}
            style={{ fontFamily: 'EB Garamond, serif' }}
          >
            {status.message}
          </p>
        )}

        <button
          onClick={handleInvite}
          disabled={loading || !username.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold btn-enchanted text-wood-900 disabled:opacity-40 transition-opacity"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          Send Invitation
        </button>
      </motion.div>
    </motion.div>
  );
}

interface GroupCardProps {
  group: ReadingGroup;
  isOwnProfile: boolean;
  onDeleted?: (id: string) => void;
  showRequestToJoin?: boolean;
  alreadyRequested?: boolean;
  onRequestJoin?: (groupId: string) => void;
}

function GroupCard({ group, isOwnProfile, onDeleted, showRequestToJoin, alreadyRequested, onRequestJoin }: GroupCardProps) {
  const router = useRouter();
  const [showInvite, setShowInvite] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const isAdmin = group.user_role === 'creator' || group.user_role === 'admin';
  const isCreator = group.user_role === 'creator';

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    const { error } = await deleteReadingGroup(group.id);
    setDeleting(false);
    if (error) {
      setDeleteError(error.message || 'Failed to delete group');
      return;
    }
    setConfirmDelete(false);
    onDeleted?.(group.id);
  };

  const handleRequestJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (requesting || alreadyRequested) return;
    setRequesting(true);
    setRequestError(null);
    const { error } = await requestToJoinGroup(group.id);
    setRequesting(false);
    if (error) {
      console.error('Failed to request to join group:', error);
      setRequestError((error as any).message || 'Could not send the request.');
      return;
    }
    onRequestJoin?.(group.id);
  };

  return (
    <>
      <motion.div
        className="p-4 rounded-xl flex items-center gap-4 transition-colors hover:bg-white/5 cursor-pointer"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => router.push(`/groups/${group.id}`)}
      >
        {/* Cover / placeholder */}
        <div
          className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#1e3a5f,#1a3a1a)', border: '1px solid rgba(218,165,32,0.15)' }}
        >
          {group.cover_url ? (
            <img src={group.cover_url} alt={group.name} className="w-full h-full object-cover" />
          ) : (
            <Users size={20} className="text-gold-DEFAULT/40" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-cream-100 text-sm font-medium truncate" style={{ fontFamily: 'Cinzel, serif' }}>
              {group.name}
            </p>
            {group.user_role && <RoleBadge role={group.user_role} />}
            {!isOwnProfile && (
              <span className="flex items-center gap-1 text-cream-400/30 text-[10px]">
                {group.is_private ? <Lock size={9} /> : <Globe size={9} />}
              </span>
            )}
          </div>
          {group.description && (
            <p className="text-cream-400/50 text-xs mt-0.5 truncate" style={{ fontFamily: 'EB Garamond, serif' }}>
              {group.description}
            </p>
          )}
        </div>

        {/* Invite / delete — own profile only */}
        {isOwnProfile && (isAdmin || isCreator) && (
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowInvite(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors text-gold-DEFAULT/70 hover:text-gold-DEFAULT"
                style={{
                  fontFamily: 'Cinzel, serif',
                  border: '1px solid rgba(218,165,32,0.2)',
                  background: 'rgba(218,165,32,0.05)',
                }}
              >
                <Plus size={12} />
                Invite
              </button>
            )}
            {isCreator && (
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteError(null); setConfirmDelete(true); }}
                aria-label={`Delete ${group.name}`}
                className="p-1.5 rounded-lg text-cream-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}

        {/* Request to join — other people's public groups you're not in */}
        {showRequestToJoin && (
          <button
            onClick={handleRequestJoin}
            disabled={requesting || alreadyRequested}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-60"
            style={{
              fontFamily: 'Cinzel, serif',
              background: alreadyRequested ? 'transparent' : 'rgba(218,165,32,0.1)',
              border: `1px solid ${alreadyRequested ? 'rgba(218,165,32,0.2)' : 'rgba(218,165,32,0.3)'}`,
              color: alreadyRequested ? 'rgba(218,165,32,0.6)' : 'rgba(218,165,32,0.9)',
            }}
          >
            <UserPlus size={12} />
            {alreadyRequested ? 'Requested' : requesting ? 'Sending…' : 'Request to Join'}
          </button>
        )}
      </motion.div>
      {requestError && (
        <p className="text-red-400 text-xs mt-1 px-1" style={{ fontFamily: 'EB Garamond, serif' }}>{requestError}</p>
      )}

      <AnimatePresence>
        {showInvite && <InviteModal group={group} onClose={() => setShowInvite(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => !deleting && setConfirmDelete(false)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#110d06', border: '1px solid rgba(218,165,32,0.2)' }}
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-cream-100 text-base mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                Delete group
              </h3>
              <p className="text-cream-400/70 text-sm mb-5" style={{ fontFamily: 'EB Garamond, serif' }}>
                Delete &ldquo;{group.name}&rdquo;? Members, invitations, and messages will be removed. This cannot be undone.
              </p>
              {deleteError && (
                <p className="text-red-400 text-xs mb-3" style={{ fontFamily: 'EB Garamond, serif' }}>{deleteError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 rounded-xl text-sm text-cream-200 border border-white/10 bg-white/5 disabled:opacity-40"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ fontFamily: 'Cinzel, serif', background: 'rgba(185,28,28,0.85)' }}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function GroupsTab({ userId, isOwnProfile }: GroupsTabProps) {
  // Own profile: show all groups (including private)
  // Other profiles: show only their public groups
  const ownHook = useMyGroups();
  const otherHook = useUserGroups(isOwnProfile ? undefined : userId);
  const { groups, loading, deleteGroup } = isOwnProfile ? ownHook : { ...otherHook, deleteGroup: undefined };

  // The viewer's own memberships — reused here to know, on someone
  // else's profile, which of their public groups the viewer is
  // already in (so "Request to Join" isn't shown redundantly).
  const myGroupIds = new Set(ownHook.groups.map((g) => g.id));
  const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOwnProfile) return;
    getMyJoinRequests().then(({ data }) => {
      setPendingRequestIds(new Set(data.map((r) => r.group_id)));
    });
  }, [isOwnProfile, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-gold-DEFAULT/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-cream-100 text-lg" style={{ fontFamily: 'Cinzel, serif' }}>
          {isOwnProfile ? 'My Groups' : 'Groups'}
        </h2>
        <span className="text-cream-400/40 text-xs" style={{ fontFamily: 'EB Garamond, serif' }}>
          {groups.length} {groups.length === 1 ? 'group' : 'groups'}
        </span>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20">
          <Users size={40} className="text-gold-DEFAULT/20 mx-auto mb-4" />
          <p className="text-cream-400/40 text-sm" style={{ fontFamily: 'EB Garamond, serif' }}>
            {isOwnProfile ? 'You haven\'t joined any groups yet.' : 'No public groups.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              isOwnProfile={isOwnProfile}
              onDeleted={deleteGroup ? (id) => { void deleteGroup(id); } : undefined}
              showRequestToJoin={!isOwnProfile && !myGroupIds.has(group.id)}
              alreadyRequested={pendingRequestIds.has(group.id)}
              onRequestJoin={(id) => setPendingRequestIds((prev) => new Set(prev).add(id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
