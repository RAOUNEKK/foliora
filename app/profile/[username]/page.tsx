'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BookOpen, UserPlus, UserMinus, Copy, QrCode, Calendar, Edit3, Check, X, Search, Users,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useFollowers, useFollowActions } from '@/hooks/useFollowers';
import { useNotifications } from '@/hooks/useNotifications';
import { useMyGroups, useReadingGroups } from '@/hooks/useReadingGroups';
import { FollowListModal } from '@/components/FollowListModal';
import { QRCodeModal } from '@/components/QRCodeModal';
import { UserSearch } from '@/components/UserSearch';
import { ProfileNavbar, type ProfileTab } from '@/components/profile/ProfileNavBar';
import { NotificationsTab } from '@/components/profile/NotificationsTab';
import { GroupsTab } from '@/components/profile/GroupsTab';

// ─── Overview tab ────────────────────────────────────────────────────────────

function OverviewTab({ profile }: { profile: any }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div
        className="p-6 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <h3 className="text-gold-DEFAULT/70 text-xs tracking-widest mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
          ABOUT
        </h3>
        {profile.bio ? (
          <p className="text-cream-300/70 text-sm leading-relaxed" style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
            {profile.bio}
          </p>
        ) : (
          <p className="text-cream-400/30 text-sm" style={{ fontFamily: 'EB Garamond, serif' }}>
            No bio yet.
          </p>
        )}
        <div className="flex items-center gap-2 mt-4 text-cream-400/30 text-xs" style={{ fontFamily: 'EB Garamond, serif' }}>
          <Calendar size={12} />
          Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}

// ─── Followers / Following tab ────────────────────────────────────────────────

function FollowListTab({
  users,
  loading,
  emptyText,
}: {
  users: any[];
  loading: boolean;
  emptyText: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-cream-400/30 text-sm" style={{ fontFamily: 'EB Garamond, serif' }}>Loading…</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-20">
        <BookOpen size={36} className="text-gold-DEFAULT/20 mx-auto mb-4" />
        <p className="text-cream-400/40 text-sm" style={{ fontFamily: 'EB Garamond, serif' }}>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-2">
      {users.map((u: any) => (
        <a
          key={u.id}
          href={`/profile/${u.username}`}
          className="flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-10 h-10 rounded-full overflow-hidden shrink-0"
            style={{ border: '1px solid rgba(218,165,32,0.2)' }}
          >
            {u.avatar_url ? (
              <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm"
                style={{ background: 'linear-gradient(135deg,#1e3a5f,#1a3a1a)', fontFamily: 'Cinzel, serif', color: 'rgba(220,210,190,0.5)' }}>
                {(u.display_name || u.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-cream-100 text-sm" style={{ fontFamily: 'Cinzel, serif' }}>
              {u.display_name || u.username}
            </p>
            <p className="text-gold-DEFAULT/50 text-xs" style={{ fontFamily: 'EB Garamond, serif' }}>@{u.username}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

// ─── Settings tab (own profile only) ─────────────────────────────────────────

function SettingsTab({ profile, onRefresh }: { profile: any; onRefresh: () => void }) {
  const { updateProfile } = useUpdateProfile();
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateProfile({ display_name: displayName, bio });
    setSaving(false);
    setSaved(true);
    onRefresh();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h2 className="text-cream-100 text-lg mb-6" style={{ fontFamily: 'Cinzel, serif' }}>Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-cream-400/60 text-xs mb-2 tracking-widest" style={{ fontFamily: 'Cinzel, serif' }}>
            DISPLAY NAME
          </label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-transparent px-4 py-3 rounded-xl text-cream-100 text-sm outline-none transition-colors"
            style={{
              fontFamily: 'EB Garamond, serif',
              border: '1px solid rgba(218,165,32,0.2)',
              background: 'rgba(255,255,255,0.03)',
            }}
            placeholder="Your display name"
          />
        </div>
        <div>
          <label className="block text-cream-400/60 text-xs mb-2 tracking-widest" style={{ fontFamily: 'Cinzel, serif' }}>
            BIO
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full bg-transparent px-4 py-3 rounded-xl text-cream-100 text-sm outline-none resize-none transition-colors"
            style={{
              fontFamily: 'EB Garamond, serif',
              border: '1px solid rgba(218,165,32,0.2)',
              background: 'rgba(255,255,255,0.03)',
            }}
            placeholder="Tell readers about yourself…"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold btn-enchanted text-wood-900 disabled:opacity-60"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          {saving ? 'Saving…' : saved ? <><Check size={14} /> Saved</> : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ─── Main ProfilePage ─────────────────────────────────────────────────────────

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const { profile, loading, error, refresh } = useProfile(params.username);
  const { followers, following, loading: listsLoading, refresh: refreshLists } = useFollowers(profile?.id);
  const { follow, unfollow, isFollowing, loading: actionLoading } = useFollowActions();
  const { updateProfile, uploadAvatar } = useUpdateProfile();
  const { unreadCount } = useNotifications();
  const { groups: myGroups } = useMyGroups();
  const { inviteMember } = useReadingGroups();

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [isFollowingState, setIsFollowingState] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showInviteToGroup, setShowInviteToGroup] = useState(false);
  const [invitedGroupIds, setInvitedGroupIds] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const isOwnProfile = user?.id === profile?.id;
  // Only groups this viewer created can actually receive invitations
  // (group_invitations_insert_creator requires the inviter to be the
  // group's creator), so members-only groups are left out here.
  const invitableGroups = myGroups.filter((g) => g.user_role === 'creator');

  useEffect(() => {
    if (!isOwnProfile && profile?.id) {
      isFollowing(profile.id).then(setIsFollowingState);
    }
  }, [profile?.id, isOwnProfile]);

  const handleFollow = async () => {
    if (!profile?.id) return;
    const { error } = await follow(profile.id);
    if (!error) { setIsFollowingState(true); refresh(); refreshLists(); }
  };

  const handleUnfollow = async () => {
    if (!profile?.id) return;
    const { error } = await unfollow(profile.id);
    if (!error) { setIsFollowingState(false); refresh(); refreshLists(); }
  };

  const handleInviteToGroup = async (groupId: string) => {
    if (!profile?.id) return;
    const { error } = await inviteMember(groupId, profile.id);
    // 23505 = unique_violation — an invite (or membership) already exists;
    // treat that the same as a freshly-sent invite in the UI.
    if (!error || (error as any).code === '23505') {
      setInvitedGroupIds((prev) => (prev.includes(groupId) ? prev : [...prev, groupId]));
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
    refresh();
    refreshProfile();
  };

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/profile/${profile?.username}`
    : `/profile/${profile?.username}`;

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0a0602' }}>
        <Navbar />
        <div className="pt-28 flex items-center justify-center">
          <div className="text-cream-400/50" style={{ fontFamily: 'Cinzel, serif' }}>Loading profile…</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen" style={{ background: '#0a0602' }}>
        <Navbar />
        <div className="pt-28 flex items-center justify-center">
          <div className="text-center">
            <BookOpen size={48} className="text-gold-DEFAULT/30 mx-auto mb-4" />
            <h2 className="text-cream-100 text-xl" style={{ fontFamily: 'Cinzel, serif' }}>Profile not found</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0602' }}>
      <Navbar />

      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <section className="pt-28 pb-4 px-4 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg,rgba(20,12,4,1) 0%,rgba(10,6,2,1) 100%)',
        }} />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(218,165,32,0.4) 0%, transparent 50%)',
        }} />

        <div className="relative max-w-4xl mx-auto">
          <motion.div
            className="flex flex-col md:flex-row items-center md:items-start gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-2"
                style={{ borderColor: 'rgba(218,165,32,0.35)' }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name || profile.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#1e3a5f,#1a3a1a)' }}>
                    <span className="text-3xl text-cream-200/60" style={{ fontFamily: 'Cinzel, serif' }}>
                      {(profile.display_name || profile.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <label
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: 'linear-gradient(135deg,#b8860b,#daa520)' }}
                >
                  <Edit3 size={13} className="text-wood-900" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              )}
            </div>

            {/* Profile info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl text-cream-100" style={{ fontFamily: 'Cinzel, serif' }}>
                {profile.display_name || profile.username}
              </h1>
              <p className="text-gold-DEFAULT/60 text-sm mb-3" style={{ fontFamily: 'EB Garamond, serif' }}>
                @{profile.username}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
                <button
                  onClick={() => setActiveTab('followers')}
                  className="text-center hover:text-gold-light transition-colors"
                >
                  <div className="text-xl font-bold text-cream-100" style={{ fontFamily: 'Cinzel, serif' }}>
                    {profile.follower_count ?? 0}
                  </div>
                  <div className="text-cream-400/40 text-xs">Followers</div>
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className="text-center hover:text-gold-light transition-colors"
                >
                  <div className="text-xl font-bold text-cream-100" style={{ fontFamily: 'Cinzel, serif' }}>
                    {profile.following_count ?? 0}
                  </div>
                  <div className="text-cream-400/40 text-xs">Following</div>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                {isOwnProfile ? (
                  <>
                    <motion.button
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-cream-200 border border-white/10 bg-white/5 hover:border-gold-dark/40 transition-all"
                      style={{ fontFamily: 'Cinzel, serif' }}
                      onClick={() => setActiveTab('settings')}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Edit3 size={14} /> Edit Profile
                    </motion.button>

                    {/* User search toggle */}
                    <motion.button
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
                      style={{
                        fontFamily: 'Cinzel, serif',
                        color: showSearch ? '#daa520' : 'rgba(220,210,190,0.5)',
                        border: `1px solid ${showSearch ? 'rgba(218,165,32,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        background: showSearch ? 'rgba(218,165,32,0.06)' : 'rgba(255,255,255,0.03)',
                      }}
                      onClick={() => setShowSearch((s) => !s)}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Search size={14} /> Find Users
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isFollowingState
                          ? 'text-cream-400 border border-white/10 bg-white/5 hover:border-red-500/30 hover:text-red-400'
                          : 'btn-enchanted text-wood-900'
                      }`}
                      style={{ fontFamily: 'Cinzel, serif' }}
                      onClick={isFollowingState ? handleUnfollow : handleFollow}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      disabled={actionLoading}
                    >
                      {isFollowingState
                        ? <><UserMinus size={14} /> Unfollow</>
                        : <><UserPlus size={14} /> Follow</>
                      }
                    </motion.button>

                    <motion.button
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all"
                      style={{
                        fontFamily: 'Cinzel, serif',
                        color: showInviteToGroup ? '#daa520' : 'rgba(220,210,190,0.5)',
                        border: `1px solid ${showInviteToGroup ? 'rgba(218,165,32,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        background: showInviteToGroup ? 'rgba(218,165,32,0.06)' : 'rgba(255,255,255,0.03)',
                      }}
                      onClick={() => setShowInviteToGroup((s) => !s)}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Users size={14} /> Invite to Group
                    </motion.button>
                  </>
                )}

                {/* Share buttons */}
                {isOwnProfile && profile.friend_code && (
                  <>
                    <motion.button
                      onClick={() => handleCopy(profileUrl, 'link')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-cream-400/60 border border-white/08 hover:border-gold-dark/30 hover:text-cream-200 transition-all"
                      style={{ fontFamily: 'Cinzel, serif', border: '1px solid rgba(255,255,255,0.08)' }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <Copy size={13} />
                      {copied === 'link' ? 'Copied!' : 'Copy Link'}
                    </motion.button>
                    <motion.button
                      onClick={() => setShowQR(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-cream-400/60 hover:text-cream-200 transition-all"
                      style={{ fontFamily: 'Cinzel, serif', border: '1px solid rgba(255,255,255,0.08)' }}
                      whileHover={{ scale: 1.03 }}
                    >
                      <QrCode size={13} /> QR Code
                    </motion.button>
                  </>
                )}
              </div>

              {/* User search panel */}
              {isOwnProfile && showSearch && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 max-w-sm"
                >
                  <UserSearch inline placeholder="Search users by username or name…" />
                </motion.div>
              )}

              {/* Invite-to-group panel */}
              {!isOwnProfile && showInviteToGroup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 max-w-sm"
                >
                  <div
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(218,165,32,0.15)' }}
                  >
                    {invitableGroups.length === 0 ? (
                      <p className="text-cream-400/40 text-sm px-1 py-1" style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
                        You haven&apos;t created a reading group yet.{' '}
                        <a href="/groups" className="text-gold-DEFAULT/80 underline hover:text-gold-DEFAULT">Create one</a>
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-gold-DEFAULT/50 text-xs tracking-widest px-1 mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
                          INVITE TO A GROUP
                        </p>
                        {invitableGroups.map((g) => {
                          const invited = invitedGroupIds.includes(g.id);
                          return (
                            <div key={g.id} className="flex items-center justify-between gap-2 px-1 py-1.5">
                              <span className="text-cream-200 text-sm truncate" style={{ fontFamily: 'EB Garamond, serif' }}>
                                {g.name}
                              </span>
                              <button
                                onClick={() => handleInviteToGroup(g.id)}
                                disabled={invited}
                                className="shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all"
                                style={{
                                  fontFamily: 'Cinzel, serif',
                                  background: invited ? 'rgba(16,185,129,0.15)' : 'rgba(218,165,32,0.1)',
                                  border: invited ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(218,165,32,0.3)',
                                  color: invited ? '#10b981' : 'rgba(218,165,32,0.9)',
                                }}
                              >
                                {invited ? '✓ Invited' : 'Invite'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Profile Tab Navbar ────────────────────────────────────────── */}
      <ProfileNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOwnProfile={isOwnProfile}
        unreadCount={isOwnProfile ? unreadCount : 0}
      />

      {/* ── Tab Content ──────────────────────────────────────────────── */}
      <main>
        {activeTab === 'overview' && <OverviewTab profile={profile} />}

        {activeTab === 'followers' && (
          <FollowListTab
            users={followers}
            loading={listsLoading}
            emptyText="No followers yet."
          />
        )}

        {activeTab === 'following' && (
          <FollowListTab
            users={following}
            loading={listsLoading}
            emptyText="Not following anyone yet."
          />
        )}

        {activeTab === 'groups' && (
          <GroupsTab userId={profile.id} isOwnProfile={isOwnProfile} />
        )}

        {activeTab === 'notifications' && isOwnProfile && (
          <NotificationsTab />
        )}

        {activeTab === 'settings' && isOwnProfile && (
          <SettingsTab profile={profile} onRefresh={() => { refresh(); refreshProfile(); }} />
        )}
      </main>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      {showFollowers && (
        <FollowListModal
          title="Followers"
          users={followers}
          loading={listsLoading}
          onClose={() => setShowFollowers(false)}
        />
      )}
      {showFollowing && (
        <FollowListModal
          title="Following"
          users={following}
          loading={listsLoading}
          onClose={() => setShowFollowing(false)}
        />
      )}
      {showQR && profile && (
        <QRCodeModal
          url={profileUrl}
          username={profile.username}
          onClose={() => setShowQR(false)}
        />
      )}
    </div>
  );
}