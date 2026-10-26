'use client';

import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Bell, 
  LogIn, 
  LogOut, 
  User, 
  ShieldCheck, 
  CheckCircle2,
  Globe
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AgriSlotAPI } from '@/lib/api';

export default function Header({ title }) {
  const [currentTime, setCurrentTime] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, openLogin, openSignup, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const displayTitle = title || t('clearanceDesk');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load In-App Notifications
  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await AgriSlotAPI.getNotifications({
          farmerId: user?.farmerId,
          userId: user?.userId
        });
        if (res.data) {
          setNotifications(res.data);
          setUnreadCount(res.meta?.unreadCount || res.data.filter(n => !n.Is_Read).length);
        }
      } catch {
        // Fallback or offline ignore
      }
    }
    loadNotifications();
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await AgriSlotAPI.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, Is_Read: 1 })));
      setUnreadCount(0);
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, Is_Read: 1 })));
      setUnreadCount(0);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await AgriSlotAPI.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.Notification_ID === id ? { ...n, Is_Read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      setNotifications(prev => prev.map(n => n.Notification_ID === id ? { ...n, Is_Read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b-[2.5px] border-navy-border">
      {/* Live Marquee / Service Ticker Strip */}
      <div className="h-9 w-full bg-saffron-light border-b-[2px] border-navy-border px-4 sm:px-6 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="px-2 py-0.5 bg-saffron text-navy-border border border-navy-border rounded-full font-mono text-[10px] font-black uppercase shadow-[1px_1px_0_#0F2B20] shrink-0">
            ⚡ LIVE SERVICES
          </span>
          <p className="font-mono text-xs text-navy-border font-bold tracking-tight truncate">
            {t('liveTicker')}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 font-mono text-xs font-bold text-forest shrink-0">
          <span className="inline-flex items-center gap-1.5 bg-white px-2.5 py-0.5 rounded-full border border-navy-border">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
            APMC GUJARAT CENTRAL
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-xs">{currentTime || '09:44:12 IST'}</span>
        </div>
      </div>

      {/* Main Action Navbar */}
      <div className="h-16 px-4 sm:px-8 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-mint-foam text-forest border-[1.5px] border-navy-border rounded-full font-mono text-xs font-black shadow-bento-sm">
            {t('inboundTerminal')}
          </span>
          <h2 className="text-base sm:text-lg font-display font-extrabold text-navy-border tracking-tight hidden sm:block">
            {displayTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Vernacular Language Switcher Pill */}
          <div className="flex items-center bg-mint-foam p-1 rounded-xl border-[1.5px] border-navy-border shadow-bento-sm font-mono text-xs font-black">
            <span className="px-1.5 text-forest flex items-center">
              <Globe className="w-3.5 h-3.5" />
            </span>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                language === 'en'
                  ? 'bg-forest text-saffron shadow-sm'
                  : 'text-navy-border hover:bg-white'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                language === 'hi'
                  ? 'bg-forest text-saffron shadow-sm'
                  : 'text-navy-border hover:bg-white'
              }`}
              title="हिन्दी (Hindi)"
            >
              हिं
            </button>
            <button
              onClick={() => setLanguage('gu')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                language === 'gu'
                  ? 'bg-forest text-saffron shadow-sm'
                  : 'text-navy-border hover:bg-white'
              }`}
              title="ગુજરાતી (Gujarati)"
            >
              ગુ
            </button>
          </div>

          {/* In-App Notifications Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative w-9 h-9 rounded-full bg-white hover:bg-mint-foam border-[2px] border-navy-border flex items-center justify-center shadow-bento-sm active:translate-y-0.5 transition-all text-navy-border"
              title="Notifications"
              aria-label="In-App Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-coral-dark text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border-[2.5px] border-navy-border rounded-2xl shadow-bento-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 bg-mint-foam border-b border-navy-border flex items-center justify-between">
                  <span className="font-display font-black text-xs uppercase tracking-wider text-navy-border">
                    {t('notificationsTitle') || 'Mandi Notifications'}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10.5px] font-mono font-bold text-forest hover:underline"
                    >
                      {t('markAllRead') || 'Mark all read'}
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 font-mono text-xs">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      {t('noNotifications') || 'No new alerts'}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.Notification_ID}
                        onClick={() => handleMarkSingleRead(n.Notification_ID)}
                        className={`p-3 transition-colors cursor-pointer ${
                          !n.Is_Read ? 'bg-mint-light/40 font-bold' : 'hover:bg-slate-50 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-900 leading-snug">{n.Title}</span>
                          {!n.Is_Read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 font-normal leading-relaxed">
                          {n.Message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Login Button with Pop-up trigger */}
          {user ? (
            <div className="flex items-center gap-2 bg-mint-light p-1.5 pr-2.5 rounded-2xl border-[1.5px] border-navy-border shadow-bento-sm">
              <div className="w-8 h-8 rounded-xl bg-forest text-saffron flex items-center justify-center font-display font-black text-xs border border-navy-border shrink-0 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name ? user.name.slice(0, 2).toUpperCase() : 'AP'
                )}
              </div>
              <div className="hidden sm:block text-left font-mono">
                <div className="text-xs font-bold text-navy-border leading-tight truncate max-w-[120px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-forest-light font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{user.role || 'Farmer'}</span>
                  {user.provider === 'google' && (
                    <span className="ml-1 inline-flex items-center gap-0.5 px-1 py-0 bg-white border border-slate-300 rounded text-[9px] text-blue-600 font-bold">
                      G-Auth
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                className="ml-1 p-1.5 rounded-lg bg-white hover:bg-coral/40 text-navy-border hover:text-coral-dark border border-navy-border active:translate-y-0.5 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={openLogin}
                className="px-3.5 py-1.5 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-saffron" />
                <span>Sign In</span>
              </button>
              <button
                onClick={openSignup}
                className="hidden sm:flex px-3 py-1.5 rounded-xl bg-saffron hover:bg-saffron-dark text-navy-border font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all"
              >
                Register
              </button>
            </div>
          )}

          <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 bg-mint-light rounded-full border-[1.5px] border-navy-border shadow-bento-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="font-mono text-xs font-bold text-forest">e-NAM SYNC ACTIVE</span>
          </div>

          <button
            onClick={() => alert('AgriSlot APMC Mandi Logistics.\nServices:\n1. Advance Slot Reservation\n2. Digital Gate-Pass Tokens (AG-T******)\n3. Fast-Track Weighbridge Entry\n4. Direct UPI Bank Settlement\nSupport: 1800-AGRI-SLOT.')}
            className="w-9 h-9 rounded-full bg-white hover:bg-mint-foam border-[2px] border-navy-border flex items-center justify-center shadow-bento-sm active:translate-y-0.5 transition-all text-navy-border"
            title="Service Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
