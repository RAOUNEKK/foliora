'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Heart, List, Compass, Menu, X, Search, LogIn, User, LogOut,
  Bell, Target, Users, ChevronDown
} from 'lucide-react';

import FolioraLogo from './FolioraLogo';
import { useBooks } from '@/context/BooksContext';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

const navLinks = [
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/reading-list', label: 'Reading List', icon: BookOpen },
];

const authLinks = [
  { href: '/reading-goals', label: 'Goals', icon: Target },
  { href: '/groups', label: 'Groups', icon: Users },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { favorites, readingList } = useBooks();
  const { user, profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = pathname === '/';

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 navbar-blur ${
        scrolled || !isHome
          ? 'bg-wood-900/90 border-b border-gold-dark/20 shadow-lg'
          : 'bg-transparent'
      }`}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="transform group-hover:scale-105 transition-transform duration-300">
              <FolioraLogo size="sm" animated={false} />
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              const badge =
                href === '/favorites' ? favorites.length :
                href === '/reading-list' ? readingList.length : 0;

              return (
                <Link key={href} href={href}>
                  <motion.div
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-gold-DEFAULT bg-gold-dark/15'
                        : 'text-cream-200 hover:text-gold-light hover:bg-white/5'
                    }`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Icon size={15} />
                    <span style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>
                      {label}
                    </span>
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gold-DEFAULT text-wood-900 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px]">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg, #b8860b, #ffd700, #b8860b)' }}
                        layoutId="navbar-active"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}

            {/* Auth-only links */}
            {user && authLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link key={href} href={href}>
                  <motion.div
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-gold-DEFAULT bg-gold-dark/15'
                        : 'text-cream-200 hover:text-gold-light hover:bg-white/5'
                    }`}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Icon size={15} />
                    <span style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>{label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 sm:gap-2">
            <Link href="/discover">
              <motion.button
                className="p-2 rounded-lg text-cream-200 hover:text-gold-light hover:bg-white/5 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Search"
              >
                <Search size={18} />
              </motion.button>
            </Link>

            {user ? (
              <>
                {/* Notifications */}
                <div className="sm:relative">
                  <motion.button
                    aria-label="Notifications"
                    className="p-2 rounded-lg text-cream-200 hover:text-gold-light hover:bg-white/5 transition-colors relative"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNotifOpen(!notifOpen)}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </motion.button>

                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        className="fixed left-3 right-3 top-[4.25rem] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 max-h-[70vh] sm:max-h-[400px] overflow-y-auto rounded-2xl shadow-enchanted z-50"
                        style={{
                          background: 'rgba(20, 12, 4, 0.97)',
                          border: '1px solid rgba(218, 165, 32, 0.2)',
                          backdropFilter: 'blur(16px)',
                        }}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      >
                        <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'rgba(218,165,32,0.15)' }}>
                          <span className="text-cream-100 text-sm" style={{ fontFamily: 'Cinzel' }}>Notifications</span>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-gold-DEFAULT text-xs hover:text-gold-light"
                              style={{ fontFamily: 'Cinzel' }}
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-cream-400/40 text-sm" style={{ fontFamily: 'EB Garamond' }}>
                            No notifications
                          </div>
                        ) : (
                          notifications.slice(0, 20).map((n) => (
                            <div
                              key={n.id}
                              className={`p-3 border-b hover:bg-white/5 transition-colors cursor-pointer ${
                                !n.read ? 'bg-gold-dark/5' : ''
                              }`}
                              style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                              onClick={() => {
                                markAsRead(n.id);
                                const gid = (n as any).data?.group_id;
                                if (gid) {
                                  setNotifOpen(false);
                                  router.push(`/groups/${gid}`);
                                }
                              }}
                            >
                              <div className="text-cream-200 text-xs font-medium" style={{ fontFamily: 'Cinzel' }}>{n.title}</div>
                              <div className="text-cream-400/50 text-xs mt-0.5" style={{ fontFamily: 'EB Garamond' }}>{n.message}</div>
                              <div className="text-cream-400/30 text-[10px] mt-1">
                                {new Date(n.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Menu */}
                <div className="relative">
                  <motion.button
                    aria-label="Profile menu"
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                    onClick={() => setProfileOpen(!profileOpen)}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden" style={{ border: '1px solid rgba(218,165,32,0.3)' }}>
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.display_name || profile.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1a3a1a)' }}>
                          <span className="text-xs text-cream-200/60" style={{ fontFamily: 'Cinzel' }}>
                            {(profile?.display_name || profile?.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronDown size={14} className="text-cream-400/40 hidden md:block" />
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-enchanted z-50 overflow-hidden"
                        style={{
                          background: 'rgba(20, 12, 4, 0.97)',
                          border: '1px solid rgba(218, 165, 32, 0.2)',
                          backdropFilter: 'blur(16px)',
                        }}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      >
                        <div className="p-3 border-b" style={{ borderColor: 'rgba(218,165,32,0.15)' }}>
                          <div className="text-cream-100 text-sm font-medium" style={{ fontFamily: 'Cinzel' }}>
                            {profile?.display_name || profile?.username || 'Reader'}
                          </div>
                          <div className="text-cream-400/40 text-xs">@{profile?.username}</div>
                        </div>
                        <div className="p-2">
                          <Link href="/profile/me" onClick={() => setProfileOpen(false)}>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-cream-200 hover:bg-white/5 transition-colors text-sm">
                              <User size={14} />
                              <span style={{ fontFamily: 'Cinzel' }}>My Profile</span>
                            </div>
                          </Link>
                          {authLinks.map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} onClick={() => setProfileOpen(false)}>
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-cream-200 hover:bg-white/5 transition-colors text-sm">
                                <Icon size={14} />
                                <span style={{ fontFamily: 'Cinzel' }}>{label}</span>
                              </div>
                            </Link>
                          ))}
                          <button
                            onClick={() => { signOut(); setProfileOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                          >
                            <LogOut size={14} />
                            <span style={{ fontFamily: 'Cinzel' }}>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link href="/auth">
                <motion.button
                  className="btn-enchanted px-4 py-2 rounded-xl text-wood-900 font-bold text-xs tracking-widest"
                  style={{ fontFamily: 'Cinzel', letterSpacing: '0.1em' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="flex items-center gap-2">
                    <LogIn size={14} />
                    SIGN IN
                  </span>
                </motion.button>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-cream-200 hover:text-gold-light hover:bg-white/5 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-wood-900/95 border-t border-gold-dark/20"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-gold-DEFAULT bg-gold-dark/15' : 'text-cream-200 hover:text-gold-light hover:bg-white/5'
                    }`}>
                      <Icon size={16} />
                      <span style={{ fontFamily: 'Cinzel' }}>{label}</span>
                    </div>
                  </Link>
                );
              })}
              {user && authLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === href ? 'text-gold-DEFAULT bg-gold-dark/15' : 'text-cream-200 hover:text-gold-light hover:bg-white/5'
                  }`}>
                    <Icon size={16} />
                    <span style={{ fontFamily: 'Cinzel' }}>{label}</span>
                  </div>
                </Link>
              ))}
              {user ? (
                <>
                  <Link href="/profile/me" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-cream-200 hover:text-gold-light hover:bg-white/5">
                      <User size={16} />
                      <span style={{ fontFamily: 'Cinzel' }}>My Profile</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut size={16} />
                    <span style={{ fontFamily: 'Cinzel' }}>Sign Out</span>
                  </button>
                </>
              ) : (
                <Link href="/auth" onClick={() => setMenuOpen(false)}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gold-DEFAULT hover:bg-gold-dark/10">
                    <LogIn size={16} />
                    <span style={{ fontFamily: 'Cinzel' }}>Sign In</span>
                  </div>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
