'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  Users,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get('tab') : null;
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

  // Three distinct role-based navigation menus: Admin, Mandi Officer, Farmer (and Public Visitor)
  let navLinks = [];
  if (user?.role === 'Admin') {
    navLinks = [
      { href: '/admin', label: 'Admin Dashboard', icon: ShieldCheck, badge: 'ADMIN' },
      { href: '/admin?tab=verify', label: 'Gate Clearance Desk', icon: QrCode, badge: 'GATE' },
      { href: '/admin?tab=active', label: 'Active In-Yard', icon: Tractor, badge: 'YARD' },
      { href: '/admin?tab=confirmed', label: 'Expected Arrivals', icon: CalendarCheck, badge: 'EXPECTED' },
      { href: '/admin?tab=bookings', label: 'All Booking History', icon: CalendarCheck, badge: 'HISTORY' },
      { href: '/admin?tab=completed', label: 'Completed Deliveries', icon: CheckCircle2, badge: 'DONE' },
      { href: '/admin?tab=no-show', label: 'No-Show Records', icon: AlertCircle, badge: 'ABSENT' },
      { href: '/admin?tab=users', label: 'Manage Roles (RBAC)', icon: Users, badge: 'ACCESS' },
      { href: '/admin?tab=analysis', label: 'Database & Reports', icon: BarChart3, badge: 'DBMS' },
      { href: '/admin?tab=slots', label: 'Slot Capacity Manager', icon: Layers },
      { href: '/admin?tab=farmers', label: 'Farmer Master Directory', icon: Tractor },
      { href: '/verify', label: 'Quick Token Lookup', icon: QrCode },
    ];
  } else if (user?.role === 'Mandi_Officer') {
    navLinks = [
      { href: '/admin?tab=verify', label: 'Gate Clearance Desk', icon: ShieldCheck, badge: 'OFFICER' },
      { href: '/admin?tab=active', label: 'Active In-Yard', icon: Tractor, badge: 'IN-YARD' },
      { href: '/admin?tab=confirmed', label: 'Expected Arrivals', icon: CalendarCheck, badge: 'EXPECTED' },
      { href: '/admin?tab=completed', label: 'Completed Deliveries', icon: CheckCircle2, badge: 'DONE' },
      { href: '/admin?tab=no-show', label: 'No-Show Records', icon: AlertCircle, badge: 'ABSENT' },
      { href: '/admin?tab=bookings', label: 'All Booking History', icon: CalendarCheck },
      { href: '/verify', label: 'Verify Gate Token', icon: QrCode },
    ];
  } else if (user?.role === 'Farmer') {
    navLinks = [
      { href: '/farmer', label: 'Book Arrival Slot', icon: Tractor, badge: 'SLOTS' },
      { href: '/farmer?tab=history', label: 'My Bookings & Passes', icon: CalendarCheck, badge: 'PASSES' },
    ];
  } else {
    // Unauthenticated visitor: Pure Farmer / Visitor links (Zero Admin / Officer links)
    navLinks = [
      { href: '/', label: 'Home Portal', icon: Layers },
      { href: '/farmer', label: 'Book Arrival Slot', icon: Tractor, badge: 'FARMER' },
    ];
  }

  const isLinkActive = (link) => {
    if (!link) return false;
    const [pathPart, queryPart] = link.href.split('?');
    if (pathname !== pathPart) return false;

    // If link has query parameters (e.g. ?tab=...)
    if (queryPart) {
      const linkParams = new URLSearchParams(queryPart);
      const linkTab = linkParams.get('tab');
      if (linkTab === 'users') {
        return currentTab === 'users' || currentTab === 'access';
      }
      if (linkTab === 'analysis') {
        return currentTab === 'analysis' || currentTab === 'dbms';
      }
      if (linkTab === 'active') {
        return currentTab === 'active' || currentTab === 'inprocess';
      }
      if (linkTab === 'verify') {
        return currentTab === 'verify' || currentTab === 'gate';
      }
      if (linkTab === 'no-show') {
        return currentTab === 'no-show' || currentTab === 'noshow';
      }
      return currentTab === linkTab;
    }

    // Link has no query string (e.g. /admin, /farmer, /, /verify)
    if (pathPart === '/admin') {
      return !currentTab || currentTab === 'overview';
    }
    if (pathPart === '/farmer') {
      return !currentTab || currentTab === 'book';
    }
    return true;
  };

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
                const isActive = isLinkActive(link);
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

          {/* APMC Farmer Helpdesk & Gate Hotline */}
          <div className="bg-mint-foam/80 p-3.5 rounded-bento-sm border-[2px] border-navy-border shadow-bento-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-forest uppercase tracking-wider">APMC HELPDESK</span>
              <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black bg-forest text-white border border-navy-border">
                24x7 TOLL-FREE
              </span>
            </div>
            <div className="font-display font-black text-xs text-navy-border flex items-center gap-1.5">
              <span>📞</span>
              <span>1800-233-0199</span>
            </div>
            <div className="text-[10.5px] text-slate-600 font-mono font-medium leading-tight">
              Kisan Helpline &amp; Gate Assistance
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

export default function Sidebar() {
  return (
    <Suspense fallback={<aside className="fixed left-0 top-0 h-full w-64 bg-white border-r-[2.5px] border-navy-border z-50 hidden lg:block" />}>
      <SidebarContent />
    </Suspense>
  );
}
