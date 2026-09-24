'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, Users, UserPlus, BookOpen, Loader2, Trash2, CheckCheck } from 'lucide-react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { useMyGroups } from '@/hooks/useReadingGroups';

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  const base = 'w-9 h-9 rounded-full flex items-center justify-center shrink-0';
  switch (type) {
    case 'group_invite':
      return <div className={base} style={{ background: 'rgba(218,165,32,0.12)' }}><Users size={16} className="text-gold-DEFAULT" /></div>;
    case 'join_request':
    case 'join_request_response':
      return <div className={base} style={{ background: 'rgba(218,165,32,0.12)' }}><Users size={16} className="text-gold-DEFAULT" /></div>;
    case 'follow':
      return <div className={base} style={{ background: 'rgba(61,140,61,0.12)' }}><UserPlus size={16} className="text-forest-400" /></div>;
    case 'goal_completed':
      return <div className={base} style={{ background: 'rgba(180,120,60,0.12)' }}><BookOpen size={16} className="text-gold-400" /></div>;
    default:
      return <div className={base} style={{ background: 'rgba(255,255,255,0.06)' }}><Bell size={16} className="text-cream-400/50" /></div>;
  }
}

interface GroupInviteActionsProps {
  notification: Notification;
  onAccept: (n: Notification) => Promise<void>;
  onReject: (n: Notification) => Promise<void>;
}

function GroupInviteActions({ notification, onAccept, onReject }: GroupInviteActionsProps) {
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    await onAccept(notification);
    setAccepting(false);
  };

  const handleReject = async () => {
    setRejecting(true);
    await onReject(notification);
    setRejecting(false);
  };

  return (
    <div className="flex items-center gap-2 mt-3">
      <button
        onClick={handleAccept}
        disabled={accepting || rejecting}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all btn-enchanted text-wood-900"
        style={{ fontFamily: 'Cinzel, serif' }}
      >
        {accepting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        Accept
      </button>
      <button
        onClick={handleReject}
        disabled={accepting || rejecting}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all text-cream-400 border border-white/10 hover:border-red-500/30 hover:text-red-400"
        style={{ fontFamily: 'Cinzel, serif' }}
      >
        {rejecting ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
        Decline
      </button>
    </div>
  );
}

export function NotificationsTab() {
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    acceptGroupInvite,
    rejectGroupInvite,
    refresh,
  } = useNotifications();
  const { refresh: refreshGroups } = useMyGroups();

  const handleAccept = async (n: Notification) => {
    await acceptGroupInvite(n);
    refreshGroups();
  };

  const handleReject = async (n: Notification) => {
    await rejectGroupInvite(n);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-gold-DEFAULT/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-cream-100 text-lg" style={{ fontFamily: 'Cinzel, serif' }}>Notifications</h2>
          {unreadCount > 0 && (
            <p className="text-gold-DEFAULT/60 text-xs mt-0.5" style={{ fontFamily: 'EB Garamond, serif' }}>
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-xs text-cream-400/60 hover:text-gold-DEFAULT transition-colors"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 && (
        <div className="text-center py-20">
          <Bell size={40} className="text-gold-DEFAULT/20 mx-auto mb-4" />
          <p className="text-cream-400/40 text-sm" style={{ fontFamily: 'EB Garamond, serif' }}>
            No notifications yet
          </p>
        </div>
      )}

      {/* List */}
      <AnimatePresence initial={false}>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-3"
          >
            <div
              className="flex gap-3 p-4 rounded-xl relative overflow-hidden transition-colors"
              style={{
                background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(218,165,32,0.05)',
                border: `1px solid ${n.read ? 'rgba(255,255,255,0.06)' : 'rgba(218,165,32,0.15)'}`,
              }}
              onClick={() => !n.read && markAsRead(n.id)}
            >
              {/* Unread dot */}
              {!n.read && (
                <div
                  className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full"
                  style={{ background: '#daa520' }}
                />
              )}

              <NotificationIcon type={n.type} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-cream-100 text-sm font-medium leading-snug"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    {n.title}
                  </p>
                  <span
                    className="text-cream-400/30 text-xs shrink-0 mt-0.5"
                    style={{ fontFamily: 'EB Garamond, serif' }}
                  >
                    {formatTimeAgo(n.created_at)}
                  </span>
                </div>
                <p
                  className="text-cream-300/60 text-sm mt-1 leading-relaxed"
                  style={{ fontFamily: 'EB Garamond, serif' }}
                >
                  {n.message}
                </p>

                {/* Group invite actions */}
                {n.type === 'group_invite' && (
                  <GroupInviteActions
                    notification={n}
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                )}

                {/* Delete button for non-invite, read notifications */}
                {n.type !== 'group_invite' && n.read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="mt-2 text-cream-400/20 hover:text-red-400/60 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}