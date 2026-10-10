'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  X,
  BookOpen,
  UserPlus,
  Check,
  XCircle,
  Trash2,
  Lock,
  Globe,
  Compass,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useReadingGroups, useAllPublicGroups } from '@/hooks/useReadingGroups';
import { useFollowers } from '@/hooks/useFollowers';
import { useAuth } from '@/context/AuthContext';

export default function GroupsPage() {
  const router = useRouter();

  const {
    groups: myGroups,
    loading: myLoading,
    createGroup,
    deleteGroup,
    inviteMember,
    respondToInvitation,
    getInvitations,
  } = useReadingGroups();

  const {
    groups: allGroups,
    loading: allLoading,
    error: allGroupsError,
  } = useAllPublicGroups();

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
  const [groupToDelete, setGroupToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const toggleFollowerSelection = (followerId: string) => {
    setSelectedFollowerIds((prev) =>
      prev.includes(followerId)
        ? prev.filter((id) => id !== followerId)
        : [...prev, followerId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const { data, error } = await createGroup({
      name,
      description,
      reading_goal: readingGoal,
      is_private: isPrivate,
    });

    if (error || !data) {
      console.error('Failed to create group:', error);

      const anyErr = error as any;
      const detail = [
        anyErr?.message,
        anyErr?.details,
        anyErr?.hint,
        anyErr?.code ? `code: ${anyErr.code}` : null,
      ]
        .filter(Boolean)
        .join(' — ');

      setCreateError(
        detail || 'Unknown error (nothing in the error object) — check the console.'
      );
      return;
    }

    const inviteResults = await Promise.allSettled(
      selectedFollowerIds.map((followerId) =>
        inviteMember(data.id, followerId)
      )
    );

    inviteResults.forEach((result, i) => {
      const followerId = selectedFollowerIds[i];

      if (result.status === 'rejected') {
        console.error(
          `Failed to invite follower ${followerId}:`,
          result.reason
        );
      } else if (result.value.error) {
        console.error(
          `Failed to invite follower ${followerId}:`,
          result.value.error
        );
      }
    });

    setShowForm(false);
    setName('');
    setDescription('');
    setReadingGoal('');
    setIsPrivate(true);
    setSelectedFollowerIds([]);
  };

  const requestDeleteGroup = (
    group: { id: string; name: string },
    e?: React.MouseEvent
  ) => {
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

    if (error) {
      console.error('Failed to load invitations:', error);
    }

    setInvitations(data || []);
  };

  const handleRespond = async (
    invId: string,
    response: 'accepted' | 'declined'
  ) => {
    const { error } = await respondToInvitation(invId, response);

    if (error) {
      console.error('Failed to respond to invitation:', error);
    }

    setInvitations((prev) => prev.filter((i) => i.id !== invId));
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0602' }}>
      <Navbar />

      <section className="relative overflow-hidden px-4 pb-8 pt-28">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(20,12,4,1) 0%, rgba(10,6,2,1) 100%)',
          }}
        />

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(61,140,61,0.4) 0%, transparent 50%)',
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          {/* Responsive page header */}
          <motion.div
            className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Users
                size={24}
                className="shrink-0 text-gold-DEFAULT"
              />

              <h1
                className="min-w-0 text-3xl text-cream-100 md:text-4xl"
                style={{
                  fontFamily: 'Cinzel',
                  letterSpacing: '0.05em',
                }}
              >
                Reading Groups
              </h1>
            </div>

            {/* Buttons fit within the mobile viewport */}
            <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:gap-3">
              <motion.button
                type="button"
                onClick={loadInvitations}
                className="relative flex shrink-0 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-cream-200 transition-all hover:border-gold-dark/40 sm:px-4"
                style={{ fontFamily: 'Cinzel' }}
                whileHover={{ scale: 1.02 }}
              >
                <UserPlus size={14} className="shrink-0" />
                <span>Invites</span>

                {invitations.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {invitations.length}
                  </span>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setShowForm(true)}
                className="btn-enchanted flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2.5 text-xs font-bold text-wood-900 sm:flex-none sm:gap-2 sm:px-5 sm:text-sm"
                style={{
                  fontFamily: 'Cinzel',
                  letterSpacing: '0.04em',
                }}
                whileHover={{ scale: 1.02 }}
              >
                <Plus size={16} className="shrink-0" />
                <span>New Group</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        {/* New Group Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              onSubmit={handleCreate}
              className="mb-8 rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(218,165,32,0.2)',
              }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3
                  className="text-sm font-semibold text-cream-100"
                  style={{ fontFamily: 'Cinzel' }}
                >
                  Create Reading Group
                </h3>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-cream-400/40 hover:text-cream-200"
                  aria-label="Close form"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Group name"
                  className="input-gold w-full rounded-xl border bg-transparent px-4 py-3 text-sm text-cream-100"
                  style={{
                    borderColor: 'rgba(218,165,32,0.2)',
                    fontFamily: 'EB Garamond',
                  }}
                  required
                />

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  rows={2}
                  className="input-gold w-full resize-none rounded-xl border bg-transparent px-4 py-3 text-sm text-cream-100"
                  style={{
                    borderColor: 'rgba(218,165,32,0.2)',
                    fontFamily: 'EB Garamond',
                  }}
                />

                <input
                  value={readingGoal}
                  onChange={(e) => setReadingGoal(e.target.value)}
                  placeholder="Group reading goal (e.g., Read 1 book together)"
                  className="input-gold w-full rounded-xl border bg-transparent px-4 py-3 text-sm text-cream-100"
                  style={{
                    borderColor: 'rgba(218,165,32,0.2)',
                    fontFamily: 'EB Garamond',
                  }}
                />

                {/* Visibility */}
                <div>
                  <p
                    className="mb-2 text-xs tracking-widest text-cream-400/50"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    VISIBILITY
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPrivate(true)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all"
                      style={{
                        fontFamily: 'Cinzel',
                        background: isPrivate
                          ? 'rgba(218,165,32,0.1)'
                          : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${
                          isPrivate
                            ? 'rgba(218,165,32,0.35)'
                            : 'rgba(255,255,255,0.06)'
                        }`,
                        color: isPrivate
                          ? 'rgba(218,165,32,0.9)'
                          : 'rgba(220,210,190,0.5)',
                      }}
                    >
                      <Lock size={14} />
                      Private
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsPrivate(false)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all"
                      style={{
                        fontFamily: 'Cinzel',
                        background: !isPrivate
                          ? 'rgba(218,165,32,0.1)'
                          : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${
                          !isPrivate
                            ? 'rgba(218,165,32,0.35)'
                            : 'rgba(255,255,255,0.06)'
                        }`,
                        color: !isPrivate
                          ? 'rgba(218,165,32,0.9)'
                          : 'rgba(220,210,190,0.5)',
                      }}
                    >
                      <Globe size={14} />
                      Public
                    </button>
                  </div>
                </div>

                {/* Followers */}
                <div>
                  <p
                    className="mb-2 text-xs tracking-widest text-cream-400/50"
                    style={{ fontFamily: 'Cinzel' }}
                  >
                    INVITE FOLLOWERS
                  </p>

                  {followers.length === 0 ? (
                    <p
                      className="text-xs italic text-cream-400/40"
                      style={{ fontFamily: 'EB Garamond' }}
                    >
                      Follow other readers to invite them to your group.
                    </p>
                  ) : (
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {followers.map((follower: any) => {
                        const followerId =
                          follower.id || follower.follower_id;

                        const selected =
                          selectedFollowerIds.includes(followerId);

                        return (
                          <button
                            key={followerId}
                            type="button"
                            onClick={() =>
                              toggleFollowerSelection(followerId)
                            }
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
                          >
                            <span className="text-sm text-cream-200">
                              {follower.username}
                            </span>

                            {selected && (
                              <Check
                                size={14}
                                className="shrink-0 text-gold-DEFAULT"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {createError && (
                <p
                  className="mt-3 text-xs text-red-400"
                  style={{ fontFamily: 'EB Garamond' }}
                >
                  {createError}
                </p>
              )}

              <button
                type="submit"
                className="btn-enchanted mt-4 rounded-xl px-6 py-2.5 text-sm font-bold text-wood-900"
                style={{
                  fontFamily: 'Cinzel',
                  letterSpacing: '0.1em',
                }}
              >
                Create Group
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Invitations */}
        <AnimatePresence>
          {showInvitations && (
            <motion.div
              className="mb-8 rounded-2xl p-6"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(218,165,32,0.2)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3
                  className="text-sm font-semibold text-cream-100"
                  style={{ fontFamily: 'Cinzel' }}
                >
                  Group Invitations
                </h3>

                <button
                  type="button"
                  onClick={() => setShowInvitations(false)}
                  className="text-cream-400/40 hover:text-cream-200"
                  aria-label="Close invitations"
                >
                  <X size={18} />
                </button>
              </div>

              {invitations.length === 0 ? (
                <p
                  className="text-sm italic text-cream-400/40"
                  style={{ fontFamily: 'EB Garamond' }}
                >
                  No pending invitations
                </p>
              ) : (
                <div className="space-y-3">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-xl p-4"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="min-w-0">
                        <div
                          className="text-sm text-cream-200"
                          style={{ fontFamily: 'Cinzel' }}
                        >
                          {inv.group?.name}
                        </div>

                        <div className="text-xs text-cream-400/40">
                          Invited by{' '}
                          {inv.inviter?.display_name ||
                            inv.inviter?.username}
                        </div>
                      </div>

                      <div className="ml-3 flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleRespond(inv.id, 'accepted')
                          }
                          aria-label="Accept invitation"
                          className="rounded-lg p-2 text-green-400 transition-colors hover:bg-green-800/20"
                        >
                          <Check size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleRespond(inv.id, 'declined')
                          }
                          aria-label="Decline invitation"
                          className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/10"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div
          className="mb-6 flex items-center gap-2 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('mine')}
            className="relative flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
            style={{
              fontFamily: 'Cinzel',
              color:
                activeTab === 'mine'
                  ? '#daa520'
                  : 'rgba(220,210,190,0.4)',
            }}
          >
            <Users size={14} />
            My Groups

            {activeTab === 'mine' && (
              <motion.div
                layoutId="groupsTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: '#daa520' }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className="relative flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
            style={{
              fontFamily: 'Cinzel',
              color:
                activeTab === 'all'
                  ? '#daa520'
                  : 'rgba(220,210,190,0.4)',
            }}
          >
            <Compass size={14} />
            All Groups

            {activeTab === 'all' && (
              <motion.div
                layoutId="groupsTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: '#daa520' }}
              />
            )}
          </button>
        </div>

        {/* Groups Grid */}
        {activeTab === 'all' && allGroupsError ? (
          <p
            className="py-8 text-center text-sm text-red-400"
            style={{ fontFamily: 'EB Garamond' }}
          >
            {(allGroupsError as any).message ||
              'Could not load groups — check the console.'}
          </p>
        ) : (activeTab === 'mine' ? myLoading : allLoading) ? (
          <div className="py-16 text-center text-cream-400/40">
            Loading groups...
          </div>
        ) : (activeTab === 'mine' ? myGroups : allGroups).length === 0 ? (
          <div className="py-16 text-center">
            <Users
              size={48}
              className="mx-auto mb-4 text-gold-DEFAULT/20"
            />

            <p
              className="text-cream-400/40"
              style={{
                fontFamily: 'EB Garamond',
                fontStyle: 'italic',
              }}
            >
              {activeTab === 'mine'
                ? 'No reading groups yet. Create one!'
                : 'No public groups yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(activeTab === 'mine' ? myGroups : allGroups).map(
              (group, i) => (
                <motion.div
                  key={group.id}
                  className="cursor-pointer rounded-2xl p-5 transition-all hover:bg-white/5"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/groups/${group.id}`)}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background:
                          'linear-gradient(135deg, #1e3a5f, #1a3a1a)',
                      }}
                    >
                      <Users
                        size={20}
                        className="text-gold-DEFAULT"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate text-sm font-medium text-cream-100"
                        style={{ fontFamily: 'Cinzel' }}
                      >
                        {group.name}
                      </h3>

                      <p className="flex items-center gap-1 text-xs text-cream-400/40">
                        {group.is_private ? (
                          <Lock size={10} />
                        ) : (
                          <Globe size={10} />
                        )}

                        {group.is_private ? 'Private' : 'Public'}
                      </p>
                    </div>

                    {user?.id === group.creator_id && (
                      <button
                        type="button"
                        aria-label={`Delete ${group.name}`}
                        onClick={(e) => requestDeleteGroup(group, e)}
                        className="shrink-0 rounded-lg p-2 text-cream-400/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {group.description && (
                    <p
                      className="mb-3 line-clamp-2 text-xs italic text-cream-400/50"
                      style={{ fontFamily: 'EB Garamond' }}
                    >
                      {group.description}
                    </p>
                  )}

                  {group.reading_goal && (
                    <div
                      className="flex items-center gap-1.5 text-xs text-gold-DEFAULT/70"
                      style={{ fontFamily: 'Cinzel' }}
                    >
                      <BookOpen size={12} />
                      {group.reading_goal}
                    </div>
                  )}
                </motion.div>
              )
            )}
          </div>
        )}
      </div>

      {/* Delete Group Confirmation */}
      <AnimatePresence>
        {groupToDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)',
            }}
            onClick={() => !deleting && setGroupToDelete(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6"
              style={{
                background: '#110d06',
                border: '1px solid rgba(218,165,32,0.2)',
              }}
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                className="mb-2 text-base text-cream-100"
                style={{ fontFamily: 'Cinzel' }}
              >
                Delete group
              </h3>

              <p
                className="mb-5 text-sm text-cream-400/70"
                style={{ fontFamily: 'EB Garamond' }}
              >
                Delete &ldquo;{groupToDelete.name}&rdquo;? Members,
                invitations, and messages will be removed. This cannot be
                undone.
              </p>

              {deleteError && (
                <p
                  className="mb-3 text-xs text-red-400"
                  style={{ fontFamily: 'EB Garamond' }}
                >
                  {deleteError}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setGroupToDelete(null)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-cream-200 transition-all hover:border-gold-dark/40 disabled:opacity-40"
                  style={{ fontFamily: 'Cinzel' }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDeleteGroup}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  style={{
                    fontFamily: 'Cinzel',
                    background: 'rgba(185,28,28,0.85)',
                  }}
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