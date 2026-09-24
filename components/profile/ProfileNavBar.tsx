'use client';

import { motion } from 'framer-motion';
import { BookOpen, Users, UserCheck, UserPlus, Bell, Settings } from 'lucide-react';

export type ProfileTab = 'overview' | 'followers' | 'following' | 'groups' | 'notifications' | 'settings';

interface ProfileNavbarProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  isOwnProfile: boolean;
  unreadCount?: number;
}

interface TabConfig {
  id: ProfileTab;
  label: string;
  icon: React.ReactNode;
  ownOnly?: boolean;
}

const TABS: TabConfig[] = [
  { id: 'overview',       label: 'Overview',       icon: <BookOpen size={15} /> },
  { id: 'followers',      label: 'Followers',      icon: <UserCheck size={15} /> },
  { id: 'following',      label: 'Following',      icon: <UserPlus size={15} /> },
  { id: 'groups',         label: 'Groups',         icon: <Users size={15} /> },
  { id: 'notifications',  label: 'Notifications',  icon: <Bell size={15} />, ownOnly: true },
  { id: 'settings',       label: 'Settings',       icon: <Settings size={15} />, ownOnly: true },
];

export function ProfileNavbar({ activeTab, onTabChange, isOwnProfile, unreadCount = 0 }: ProfileNavbarProps) {
  const visibleTabs = TABS.filter((t) => !t.ownOnly || isOwnProfile);

  return (
    <div
      className="sticky top-16 z-30 px-4"
      style={{ background: 'rgba(10,6,2,0.92)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-4xl mx-auto">
        <div
          className="flex items-center overflow-x-auto scrollbar-hide gap-1 py-1"
          style={{ borderBottom: '1px solid rgba(218,165,32,0.12)' }}
        >
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap transition-colors shrink-0"
                style={{
                  fontFamily: 'Cinzel, serif',
                  color: isActive ? 'rgba(218,165,32,1)' : 'rgba(220,210,190,0.45)',
                  letterSpacing: '0.05em',
                  fontSize: '0.72rem',
                }}
              >
                {tab.icon}
                {tab.label}

                {/* Notification badge */}
                {tab.id === 'notifications' && unreadCount > 0 && (
                  <span
                    className="absolute top-2 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-wood-900"
                    style={{ background: 'linear-gradient(135deg,#b8860b,#daa520)' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}

                {/* Active underline */}
                {isActive && (
                  <motion.div
                    layoutId="profile-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg,#b8860b,#daa520)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}