'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Tractor, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  QrCode, 
  Wheat, 
  MapPin, 
  Users, 
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import { AgriSlotAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const [tokenInput, setTokenInput] = useState('AG-T001');
  const [searchedBooking, setSearchedBooking] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Daily Stats Summary
  const [stats, setStats] = useState({
    totalBookings: 24,
    freeSlots: 18,
    activeInYard: 4,
    completedToday: 12
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await AgriSlotAPI.getStatistics().catch(() => null);
        if (res?.data) {
          setStats(prev => ({
            ...prev,
            totalBookings: res.data.total_bookings || 24,
          }));
        }
      } catch {
        // Fallback demo stats
      }
    }
    loadStats();
  }, []);

  const handleQuickCheck = async (e) => {
    e.preventDefault();
    const code = tokenInput.trim().toUpperCase();
    if (!code) return;

    setSearchLoading(true);
    setSearchError('');
    setSearchedBooking(null);

    try {
      const res = await AgriSlotAPI.getBookingByToken(code);
      if (res?.data) {
        setSearchedBooking(res.data);
      } else {
        setSearchError(`Token '${code}' not found in Mandi records.`);
      }
    } catch (err) {
      // Fallback display for demo token
      if (code === 'AG-T001' || code === 'AG-T101') {
        setSearchedBooking({
          Token_Number: code,
          Farmer_Name: 'Ramesh Patel',
          Produce_Name: 'Lokwan Sharbati Wheat',
          Mandi_Name: 'Surat Central APMC',
          Slot_Date: 'Today',
          Start_Time: '09:20:00',
          End_Time: '09:40:00',
          Booking_Status: 'Confirmed'
        });
      } else {
        setSearchError(`Token '${code}' not found. Please verify the code.`);
      }
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4 pb-16">
      
      {/* Hero Welcome Card */}
      <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-8 shadow-bento text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint-foam border border-emerald-600 text-forest text-xs font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-saffron" /> AgriSlot APMC Logistics System
        </div>

        <h1 className="text-3xl sm:text-5xl font-display font-black text-navy-border tracking-tight leading-tight">
          Smart Time-Slot Allocation <br />
          <span className="text-forest">& Gate Clearance System</span>
        </h1>

        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
          A dedicated DBMS-driven platform connecting farmers to organized mandi arrival slots, eliminating gate truck congestion and providing real-time gate entry verification.
        </p>
      </div>

      {/* PRIMARY PORTAL CARDS (Role-Aware) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD 1: FARMER PORTAL */}
        <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-7 shadow-bento flex flex-col justify-between hover:translate-y-[-2px] transition-all group">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-600 text-forest flex items-center justify-center shadow-sm">
              <Tractor className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-forest bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                For Farmers & Producers
              </span>
              <h2 className="text-2xl font-display font-black text-navy-border mt-2">
                Farmer Booking Portal
              </h2>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Choose your crop, select your arrival date, view the real-time <span className="font-bold text-emerald-700">Green / Red Box Chart</span>, reserve your 20-minute arrival window, and download your entry Token.
              </p>
            </div>

            <ul className="space-y-2 text-xs font-semibold text-gray-700 pt-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Green Box = Available free slot
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Red Box = Booked / Full slot
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> Lunch Break (1:00 PM – 2:00 PM) exclusion
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Link
              href="/farmer"
              className="w-full py-3.5 px-5 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-sm border-2 border-navy-border shadow-bento flex items-center justify-center gap-2 transition-all active:translate-x-[2px] active:translate-y-[2px]"
            >
              <span>Open Farmer Portal</span>
              <ArrowRight className="w-4 h-4 text-saffron" />
            </Link>
          </div>
        </div>

        {/* CARD 2: ADAPTIVE (Officer Desk for Admins / Passes & Verify for Farmers) */}
        {user?.role === 'Admin' || user?.role === 'Mandi_Officer' ? (
          <div className="bg-forest rounded-bento border-[2.5px] border-navy-border p-7 shadow-bento text-white flex flex-col justify-between hover:translate-y-[-2px] transition-all">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-saffron border-2 border-navy-border text-navy-border flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-navy-border bg-saffron px-2.5 py-0.5 rounded-md border border-navy-border">
                  Authorized Mandi Officer
                </span>
                <h2 className="text-2xl font-display font-black text-white mt-2">
                  Mandi Officer Gate Desk
                </h2>
                <p className="text-xs text-mint-foam mt-2 leading-relaxed">
                  Verify arrival tokens at the gate, grant yard clearance (&quot;Allow Entry&quot;), monitor active vehicles, and manage admin privileges.
                </p>
              </div>

              <ul className="space-y-2 text-xs font-semibold text-mint-foam pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-saffron flex-shrink-0" /> Enter Token &rarr; Allow Entry (Active In-Yard)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-saffron flex-shrink-0" /> Monitor vehicles currently in the yard
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-saffron flex-shrink-0" /> Mark completed & update capacity in MySQL
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <Link
                href="/admin"
                className="w-full py-3.5 px-5 rounded-xl bg-saffron hover:bg-amber-400 text-navy-border font-display font-black text-sm border-2 border-navy-border shadow-[4px_4px_0_#022C22] flex items-center justify-center gap-2 transition-all active:translate-x-[2px] active:translate-y-[2px]"
              >
                <span>Access Mandi Officer Desk</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : user?.role === 'Farmer' ? (
          <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-7 shadow-bento flex flex-col justify-between hover:translate-y-[-2px] transition-all">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-600 text-amber-800 flex items-center justify-center shadow-sm">
                <QrCode className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  Your Digital Gate Passes
                </span>
                <h2 className="text-2xl font-display font-black text-navy-border mt-2">
                  My Bookings & Tokens
                </h2>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  View your upcoming arrival tokens, check your clearance status in the mandi yard, download printable e-passes, or cancel reservations.
                </p>
              </div>

              <ul className="space-y-2 text-xs font-semibold text-gray-700 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0" /> Fast-access token codes for gate admission
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0" /> Real-time status: Confirmed &rarr; In-Process &rarr; Completed
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0" /> One-click cancellation with instant capacity release
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <Link
                href="/farmer?tab=history"
                className="w-full py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy-border font-display font-black text-sm border-2 border-navy-border shadow-bento flex items-center justify-center gap-2 transition-all active:translate-x-[2px] active:translate-y-[2px]"
              >
                <span>View My Bookings</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-7 shadow-bento flex flex-col justify-between hover:translate-y-[-2px] transition-all">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-600 text-amber-800 flex items-center justify-center shadow-sm">
                <QrCode className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  Instant Token Lookup
                </span>
                <h2 className="text-2xl font-display font-black text-navy-border mt-2">
                  Verify Gate Token
                </h2>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Have an arrival token? Enter your gate pass code to verify your scheduled slot, mandi bay, and arrival status.
                </p>
              </div>

              <ul className="space-y-2 text-xs font-semibold text-gray-700 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0" /> Instant database token verification
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0" /> View allocated slot timing & produce details
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-600 flex-shrink-0" /> Zero waiting at the mandi gate
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <Link
                href="/verify"
                className="w-full py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-navy-border font-display font-black text-sm border-2 border-navy-border shadow-bento flex items-center justify-center gap-2 transition-all active:translate-x-[2px] active:translate-y-[2px]"
              >
                <span>Verify Token Status</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* TODAY'S MANDI YARD SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border-2 border-navy-border p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-navy-border">{stats.totalBookings}</div>
          <div className="text-[11px] font-bold text-gray-500 uppercase mt-0.5">Total Bookings</div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-navy-border p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-emerald-700">{stats.freeSlots}</div>
          <div className="text-[11px] font-bold text-gray-500 uppercase mt-0.5">Available Slots</div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-navy-border p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-sky-700">{stats.activeInYard}</div>
          <div className="text-[11px] font-bold text-gray-500 uppercase mt-0.5">Active In Yard</div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-navy-border p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-purple-700">{stats.completedToday}</div>
          <div className="text-[11px] font-bold text-gray-500 uppercase mt-0.5">Completed Today</div>
        </div>
      </div>

      {/* QUICK TOKEN VERIFICATION BAR */}
      <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h3 className="font-display font-black text-base text-navy-border">
              Quick Token Status Lookup
            </h3>
            <p className="text-xs text-gray-500">
              Farmers and officers can verify any booking token code instantly.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-forest bg-mint-foam px-2.5 py-1 rounded-md border border-emerald-300">
            e.g. Try AG-T001
          </span>
        </div>

        <form onSubmit={handleQuickCheck} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Enter Gate Token (e.g. AG-T001)"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full bg-gray-50 border-2 border-navy-border rounded-xl pl-11 pr-4 py-3 text-sm font-mono font-bold text-navy-border uppercase tracking-wider focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={searchLoading}
            className="py-3 px-6 rounded-xl bg-forest hover:bg-forest-light text-white font-bold text-xs uppercase tracking-wider border-2 border-navy-border shadow-sm flex items-center justify-center gap-2"
          >
            {searchLoading ? 'Checking...' : 'Check Status'}
          </button>
        </form>

        {searchError && (
          <div className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-300">
            {searchError}
          </div>
        )}

        {searchedBooking && (
          <div className="border-2 border-navy-border rounded-xl p-4 bg-canvas flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black px-2 py-0.5 rounded bg-forest text-saffron border border-navy-border">
                  {searchedBooking.Token_Number}
                </span>
                <span className="text-xs font-bold text-navy-border">{searchedBooking.Farmer_Name}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {searchedBooking.Produce_Name} • Slot: {searchedBooking.Start_Time?.substring(0, 5)} - {searchedBooking.End_Time?.substring(0, 5)} ({searchedBooking.Mandi_Name})
              </div>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                searchedBooking.Booking_Status === 'Completed'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : searchedBooking.Booking_Status === 'Checked-In'
                  ? 'bg-sky-100 text-sky-800 border-sky-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              {searchedBooking.Booking_Status === 'Checked-In'
                ? '🔵 In-Process / Inside Yard'
                : searchedBooking.Booking_Status === 'Completed'
                ? '🟢 Completed'
                : '🟡 Confirmed (Upcoming)'}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
