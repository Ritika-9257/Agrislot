'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Scale, 
  Layers, 
  BarChart3, 
  QrCode, 
  ShieldCheck, 
  Tractor,
  LogIn,
  CheckCircle2,
  CalendarCheck,
  Users
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(null);
  const { user, openLogin } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    async function checkHealth() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
        const res = await fetch(`${apiUrl}/health`, { cache: 'no-store' });
        setBackendOnline(res.ok);
      } catch {
        setBackendOnline(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Role-aware navigation: Admins, normal users (Farmers), and public visitors
  const isPrivileged = user?.role === 'Admin' || user?.role === 'Mandi_Officer';

  let navLinks = [];
  if (isPrivileged) {
    navLinks = [
      { href: '/admin', label: t('navAdminDesk'), icon: Scale, badge: 'OFFICER' },
      { href: '/admin?tab=users', label: t('navUserMgmt') || 'User Roles & Access', icon: Users, badge: 'RBAC' },
      { href: '/', label: t('navClearance'), icon: ShieldCheck, badge: 'LIVE' },
      { href: '/analytics', label: t('navAnalytics'), icon: BarChart3 },
      { href: '/verify', label: t('navVerifyPass'), icon: QrCode },
    ];
  } else if (user?.role === 'Farmer') {
    navLinks = [
      { href: '/farmer', label: t('navMyBookings') || 'My Bookings & Slots', icon: Tractor, badge: 'DASHBOARD' },
      { href: '/', label: t('navClearance'), icon: ShieldCheck, badge: 'TERMINAL' },
      { href: '/verify', label: t('navVerifyPass'), icon: QrCode },
    ];
  } else {
    // Unauthenticated visitor
    navLinks = [
      { href: '/', label: t('navClearance'), icon: ShieldCheck, badge: 'LIVE' },
      { href: '/farmer', label: t('navBookSlot'), icon: Tractor },
      { href: '/verify', label: t('navVerifyPass'), icon: QrCode },
    ];
  }

  return (
    <>
      {/* Mobile Sticky Top Bar with Hamburger */}
      <div className="lg:hidden sticky top-0 z-50 bg-white border-b-[2.5px] border-navy-border px-4 py-3 flex items-center justify-between shadow-[0_2px_0_#0F2B20]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-forest text-saffron border-[1.5px] border-navy-border flex items-center justify-center font-display font-black text-sm shadow-[1.5px_1.5px_0px_#0F2B20]">
            AS
          </div>
          <div>
            <span className="font-display font-black text-base text-navy-border tracking-tight">AgriSlot</span>
            <span className="ml-1 font-mono text-[9px] font-bold bg-mint-foam text-forest px-1.5 py-0.5 rounded border border-navy-border">APMC</span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg border-[2px] border-navy-border bg-mint-foam hover:bg-mint-light text-navy-border active:translate-y-0.5"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-navy-border/50 z-40 backdrop-blur-sm"
        />
      )}

      {/* Main Sidebar (Fixed on Desktop) */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r-[2.5px] border-navy-border z-50 flex flex-col justify-between py-6 px-4 shadow-[4px_0_0_#0F2B20] transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* App Brand Logo Pill */}
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="p-3 bg-mint-foam border-[2px] border-navy-border rounded-bento-sm shadow-bento-sm flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-forest text-saffron border-[1.5px] border-navy-border flex items-center justify-center font-display font-black text-xl shadow-[1.5px_1.5px_0px_#0F2B20] group-hover:scale-105 transition-transform">
              AS
            </div>
            <div>
              <div className="font-display font-black text-base leading-tight tracking-tight text-forest flex items-center gap-1">
                AgriSlot
                <span className="w-2 h-2 rounded-full bg-saffron inline-block"></span>
              </div>
              <div className="font-mono text-[10px] font-bold text-forest-light tracking-widest uppercase">
                MANDI LOGISTICS OS
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div>
            <span className="px-2 font-mono text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              APMC SERVICES
            </span>
            <nav className="space-y-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-[2px] font-semibold text-sm transition-all ${
                      isActive
                        ? 'border-navy-border bg-saffron text-navy-border font-bold shadow-bento-sm'
                        : 'border-transparent text-slate-600 hover:text-forest hover:bg-mint-foam/60 hover:border-navy-border/20'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className={`ml-auto px-1.5 py-0.5 rounded-md font-mono text-[9px] font-black ${
                        isActive ? 'bg-forest text-white' : 'bg-mint-foam text-forest border border-navy-border/30'
                      }`}>
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Practical Mandi Service Status Widget */}
          <div className="bg-lilac p-3.5 rounded-bento-sm border-[2px] border-navy-border shadow-bento-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-lilac-dark uppercase">MANDI OPERATIONAL</span>
              <span
                className={`w-2 h-2 rounded-full pulse-dot ${
                  backendOnline === true ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="font-bold text-xs text-navy-border">SURAT &amp; NASHIK HUBS</div>
            <div className="text-[11px] text-slate-600 flex items-center gap-1 font-mono font-medium">
              Daily Slots Open • Fast Clearance
            </div>
          </div>
        </div>

        {/* Bottom User / Login Pill */}
        <div className="pt-4 border-t-2 border-dashed border-slate-200">
          {user ? (
            <div className="flex items-center gap-3 bg-mint-light p-2.5 rounded-xl border-[1.5px] border-navy-border">
              <div className="w-8 h-8 rounded-full bg-forest text-saffron flex items-center justify-center font-bold text-xs border border-navy-border shrink-0 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name ? user.name.slice(0, 2).toUpperCase() : 'AS'
                )}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs truncate text-navy-border flex items-center gap-1.5">
                  <span className="truncate">{user.name}</span>
                  {user.provider === 'google' && (
                    <span className="shrink-0 px-1 py-0.2 bg-white text-[8px] font-mono font-bold text-blue-600 rounded border border-blue-200">
                      Google
                    </span>
                  )}
                </div>
                <div className="font-mono text-[10px] text-forest-light truncate font-semibold">
                  {user.village ? `${user.village}, ${user.district || 'Gujarat'}` : user.role || 'Farmer'}
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={openLogin}
              className="w-full flex items-center gap-3 bg-white hover:bg-mint-foam p-2.5 rounded-xl border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-saffron text-navy-border flex items-center justify-center font-bold text-xs border border-navy-border shrink-0">
                <LogIn className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs truncate text-navy-border">Sign In / Register</div>
                <div className="font-mono text-[10px] text-slate-500 truncate font-semibold">
                  Farmer &amp; Officer Access
                </div>
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
