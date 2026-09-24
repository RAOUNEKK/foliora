'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, X, BookOpen, UserPlus, Check, XCircle, Trash2, Lock, Globe, Compass } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useReadingGroups, useAllPublicGroups } from '@/hooks/useReadingGroups';
import { useFollowers } from '@/hooks/useFollowers';
import { useAuth } from '@/context/AuthContext';

export default function GroupsPage() {
  const router = useRouter();
  const { groups: myGroups, loading: myLoading, createGroup, deleteGroup, inviteMember, respondToInvitation, getInvitations } = useReadingGroups();
  const { groups: allGroups, loading: allLoading, error: allGroupsError } = useAllPublicGroups();
  const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine');
  const { user } = useAuth();
  const { followers } = useFollowers(user?.id);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [readingGoal, setReadingGoal] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [selectedFollowerIds, setSelectedFollowerIds] = useState<string[]>([]);
  const [showInvitations, setShowInvitations] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleFollowerSelection = (followerId: string) => {
    setSelectedFollowerIds((prev) =>
      prev.includes(followerId) ? prev.filter((id) => id !== followerId) : [...prev, followerId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const { data, error } = await createGroup({ name, description, reading_goal: readingGoal, is_private: isPrivate });
    if (error || !data) {
      console.error('Failed to create group:', error);
      const anyErr = error as any;
      const detail = [anyErr?.message, anyErr?.details, anyErr?.hint, anyErr?.code ? `code: ${anyErr.code}` : null]
        .filter(Boolean)
        .join(' — ');
      setCreateError(detail || 'Unknown error (nothing in the error object) — check the console.');
      return;
    }
    // The group now exists, so invitations can reference its id — send one
    // to each follower picked in the form. allSettled (not all) so one
    // failed invite can't stop the form from closing on an otherwise
    // successful creation.
    const inviteResults = await Promise.allSettled(
      selectedFollowerIds.map((followerId) => inviteMember(data.id, followerId))
    );
    inviteResults.forEach((result, i) => {
      const followerId = selectedFollowerIds[i];
      if (result.status === 'rejected') {
        console.error(`Failed to invite follower ${followerId}:`, result.reason);
      } else if (result.value.error) {
        console.error(`Failed to invite follower ${followerId}:`, result.value.error);
      }
    });
    setShowForm(false);
    setName('');
    setDescription('');
    setReadingGoal('');
    setIsPrivate(true);
    setSelectedFollowerIds([]);
  };

  const requestDeleteGroup = (group: { id: string; name: string }, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteError(null);
    setGroupToDelete({ id: group.id, name: group.name });
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    const { error } = await deleteGroup(groupToDelete.id);
    setDeleting(false);
    if (error) {
      setDeleteError(error.message || 'Failed to delete group');
      return;
    }
    setGroupToDelete(null);
  };

  const loadInvitations = async () => {
    setShowInvitations(true);
    const { data, error } = await getInvitations();
    if (error) console.error('Failed to load invitations:', error);
    setInvitations(data || []);
  };

  const handleRespond = async (invId: string, response: 'accepted' | 'declined') => {
    const { error } = await respondToInvitation(invId, response);
    if (error) console.error('Failed to respond to invitation:', error);
    setInvitations((prev) => prev.filter((i) => i.id !== invId));
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0602' }}>
      <Navbar />

      <section className="pt-28 pb-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,12,4,1) 0%, rgba(10,6,2,1) 100%)' }} />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(61,140,61,0.4) 0%, transparent 50%)',
        }} />

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <Users size={24} className="text-gold-DEFAULT" />
              <h1 className="text-3xl md:text-4xl text-cream-100" style={{ fontFamily: 'Cinzel', letterSpacing: '0.05em' }}>
                Reading Groups
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={loadInvitations}
                className="px-4 py-2 rounded-xl text-sm font-medium text-cream-200 border border-white/10 bg-white/5 hover:border-gold-dark/40 transition-all relative"
                style={{ fontFamily: 'Cinzel' }}
                whileHover={{ scale: 1.03 }}
              >
                <UserPlus size={14} className="inline mr-1" />
                Invites
                {invitations.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {invitations.length}
                  </span>
                )}
              </motion.button>
              <motion.button
                onClick={() => setShowForm(true)}
                className="btn-enchanted px-5 py-2.5 rounded-xl text-wood-900 font-bold text-sm flex items-center gap-2"
                style={{ fontFamily: 'Cinzel', letterSpacing: '0.1em' }}
                whileHover={{ scale: 1.03 }}
              >
                <Plus size={16} />
                New Group
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-16">

        {/* New Group Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              onSubmit={handleCreate}
              className="mb-8 p-6 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(218,165,32,0.2)' }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-cream-100 text-sm font-semibold" style={{ fontFamily: 'Cinzel' }}>Create Reading Group</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-cream-400/40 hover:text-cream-200"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" className="w-full bg-transparent border rounded-xl px-4 py-3 text-cream-100 text-sm input-gold" style={{ borderColor: 'rgba(218,165,32,0.2)', fontFamily: 'EB Garamond' }} required />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} className="w-full bg-transparent border rounded-xl px-4 py-3 text-cream-100 text-sm input-gold resize-none" style={{ borderColor: 'rgba(218,165,32,0.2)', fontFamily: 'EB Garamond' }} />
                <input value={readingGoal} onChange={(e) => setReadingGoal(e.target.value)} placeholder="Group reading goal (e.g., Read 1 book together)" className="w-full bg-transparent border rounded-xl px-4 py-3 text-cream-100 text-sm input-gold" style={{ borderColor: 'rgba(218,165,32,0.2)', fontFamily: 'EB Garamond' }} />

                {/* Visibility */}
                <div>
                  <p className="text-cream-400/50 text-xs tracking-widest mb-2" style={{ fontFamily: 'Cinzel' }}>
                    VISIBILITY
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
                      style={{
                        fontFamily: 'Cinzel',
                        background: isPrivate ? 'rgba(218,165,32,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isPrivate ? 'rgba(218,165,32,0.35)' : 'rgba(255,255,255,0.06)'}`,
                        color: isPrivate ? 'rgba(218,165,32,0.9)' : 'rgba(220,210,190,0.5)',
                      }}
                    >
                      <Lock size={14} /> Private
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
                      style={{
                        fontFamily: 'Cinzel',
                        background: !isPrivate ? 'rgba(218,165,32,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${!isPrivate ? 'rgba(218,165,32,0.35)' : 'rgba(255,255,255,0.06)'}`,
                        color: !isPrivate ? 'rgba(218,165,32,0.9)' : 'rgba(220,210,190,0.5)',
                      }}
                    >
                      <Globe size={14} /> Public
                    </button>
                  </div>
                  <p className="text-cream-400/30 text-xs mt-1.5 italic" style={{ fontFamily: 'EB Garamond' }}>
                    {isPrivate
                      ? 'Only people you invite can join. It won\u2019t appear in All Groups.'
                      : 'Anyone can find it under All Groups and request to join.'}
                  </p>
                </div>

                {/* Invite followers while creating the group */}
                <div>
                  <p className="text-cream-400/50 text-xs tracking-widest mb-2" style={{ fontFamily: 'Cinzel' }}>
                    INVITE FOLLOWERS (OPTIONAL)
                  </p>
                  {followers.length === 0 ? (
                    <p className="text-cream-400/30 text-xs italic" style={{ fontFamily: 'EB Garamond' }}>
                      You don&apos;t have any followers yet to invite.
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {followers.map((f: any) => {
                        const selected = selectedFollowerIds.includes(f.id);
                        return (
                          <button
                            type="button"
                            key={f.id}
                            onClick={() => toggleFollowerSelection(f.id)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all"
                            style={{
                              background: selected ? 'rgba(218,165,32,0.1)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${selected ? 'rgba(218,165,32,0.35)' : 'rgba(255,255,255,0.06)'}`,
                            }}
                          >
                            <div
                              className="w-7 h-7 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs"
                              style={{ background: 'linear-gradient(135deg,#1e3a5f,#1a3a1a)', fontFamily: 'Cinzel', color: 'rgba(220,210,190,0.6)' }}
                            >
                              {f.avatar_url ? (
                                <img src={f.avatar_url} alt={f.username} className="w-full h-full object-cover" />
                              ) : (
                                (f.display_name || f.username).charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="flex-1 text-sm text-cream-200 truncate" style={{ fontFamily: 'EB Garamond' }}>
                              {f.display_name || f.username}
                            </span>
                            {selected && <Check size={14} className="text-gold-DEFAULT shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              {createError && (
                <p className="text-red-400 text-xs mt-3" style={{ fontFamily: 'EB Garamond' }}>{createError}</p>
              )}
              <button type="submit" className="mt-4 btn-enchanted px-6 py-2.5 rounded-xl text-wood-900 font-bold text-sm" style={{ fontFamily: 'Cinzel', letterSpacing: '0.1em' }}>Create Group</button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Invitations */}
        <AnimatePresence>
          {showInvitations && (
            <motion.div className="mb-8 p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(218,165,32,0.2)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-cream-100 text-sm font-semibold" style={{ fontFamily: 'Cinzel' }}>Group Invitations</h3>
                <button onClick={() => setShowInvitations(false)} className="text-cream-400/40 hover:text-cream-200"><X size={18} /></button>
              </div>
              {invitations.length === 0 ? (
                <p className="text-cream-400/40 text-sm" style={{ fontFamily: 'EB Garamond', fontStyle: 'italic' }}>No pending invitations</p>
              ) : (
                <div className="space-y-3">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <div className="text-cream-200 text-sm" style={{ fontFamily: 'Cinzel' }}>{inv.group?.name}</div>
                        <div className="text-cream-400/40 text-xs">Invited by {inv.inviter?.display_name || inv.inviter?.username}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRespond(inv.id, 'accepted')} className="p-2 rounded-lg text-green-400 hover:bg-green-800/20 transition-colors"><Check size={16} /></button>
                        <button onClick={() => handleRespond(inv.id, 'declined')} className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><XCircle size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setActiveTab('mine')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors relative"
            style={{
              fontFamily: 'Cinzel',
              color: activeTab === 'mine' ? '#daa520' : 'rgba(220,210,190,0.4)',
            }}
          >
            <Users size={14} /> My Groups
            {activeTab === 'mine' && (
              <motion.div layoutId="groupsTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#daa520' }} />
            )}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors relative"
            style={{
              fontFamily: 'Cinzel',
              color: activeTab === 'all' ? '#daa520' : 'rgba(220,210,190,0.4)',
            }}
          >
            <Compass size={14} /> All Groups
            {activeTab === 'all' && (
              <motion.div layoutId="groupsTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#daa520' }} />
            )}
          </button>
        </div>

        {/* Groups Grid */}
        {activeTab === 'all' && allGroupsError ? (
          <p className="text-red-400 text-sm text-center py-8" style={{ fontFamily: 'EB Garamond' }}>
            {(allGroupsError as any).message || 'Could not load groups — check the console.'}
          </p>
        ) : (activeTab === 'mine' ? myLoading : allLoading) ? (
          <div className="text-center py-16 text-cream-400/40">Loading groups...</div>
        ) : (activeTab === 'mine' ? myGroups : allGroups).length === 0 ? (
          <div className="text-center py-16">
            <Users size={48} className="text-gold-DEFAULT/20 mx-auto mb-4" />
            <p className="text-cream-400/40" style={{ fontFamily: 'EB Garamond', fontStyle: 'italic' }}>
              {activeTab === 'mine' ? 'No reading groups yet. Create one!' : 'No public groups yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(activeTab === 'mine' ? myGroups : allGroups).map((group, i) => (
              <motion.div
                key={group.id}
                className="p-5 rounded-2xl cursor-pointer hover:bg-white/5 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`/groups/${group.id}`)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1a3a1a)' }}>
                    <Users size={20} className="text-gold-DEFAULT" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-cream-100 text-sm font-medium truncate" style={{ fontFamily: 'Cinzel' }}>{group.name}</h3>
                    <p className="flex items-center gap-1 text-cream-400/40 text-xs">
                      {group.is_private ? <Lock size={10} /> : <Globe size={10} />}
                      {group.is_private ? 'Private' : 'Public'}
                    </p>
                  </div>
                  {user?.id === group.creator_id && (
                    <button
                      type="button"
                      aria-label={`Delete ${group.name}`}
                      onClick={(e) => requestDeleteGroup(group, e)}
                      className="p-2 rounded-lg text-cream-400/40 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                {group.description && (
                  <p className="text-cream-400/50 text-xs mb-3 line-clamp-2" style={{ fontFamily: 'EB Garamond', fontStyle: 'italic' }}>{group.description}</p>
                )}
                {group.reading_goal && (
                  <div className="flex items-center gap-1.5 text-xs text-gold-DEFAULT/70" style={{ fontFamily: 'Cinzel' }}>
                    <BookOpen size={12} />
                    {group.reading_goal}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {groupToDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={() => !deleting && setGroupToDelete(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#110d06', border: '1px solid rgba(218,165,32,0.2)' }}
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-cream-100 text-base mb-2" style={{ fontFamily: 'Cinzel' }}>
                Delete group
              </h3>
              <p className="text-cream-400/70 text-sm mb-5" style={{ fontFamily: 'EB Garamond' }}>
                Delete &ldquo;{groupToDelete.name}&rdquo;? Members, invitations, and messages will be removed. This cannot be undone.
              </p>
              {deleteError && (
                <p className="text-red-400 text-xs mb-3" style={{ fontFamily: 'EB Garamond' }}>{deleteError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setGroupToDelete(null)}
                  className="px-4 py-2 rounded-xl text-sm text-cream-200 border border-white/10 bg-white/5 hover:border-gold-dark/40 transition-all disabled:opacity-40"
                  style={{ fontFamily: 'Cinzel' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDeleteGroup}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ fontFamily: 'Cinzel', background: 'rgba(185,28,28,0.85)' }}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
