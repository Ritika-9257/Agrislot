'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Tractor, 
  QrCode, 
  Layers, 
  Users, 
  Building2, 
  Lock, 
  Mail, 
  RefreshCw, 
  Calendar, 
  Sparkles,
  ArrowRight,
  Database,
  Server,
  Scale
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AgriSlotAPI } from '@/lib/api';

function ProfileContent() {
  const { user, token, updateUserProfile, refreshProfile, openLogin } = useAuth();
  const searchParams = useSearchParams();
  const noticeParam = searchParams.get('notice');

  // Form Fields State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [upiId, setUpiId] = useState('');

  // Status & Feedback State
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);

  // Initialize form fields from live user state
  useEffect(() => {
    if (user) {
      setFullName(user.name || user.username || '');
      setPhone(user.phone && !user.phone.startsWith('9000000') ? user.phone : '');
      setVillage(user.village && user.village !== 'Mandi Area' ? user.village : '');
      setUpiId(user.upiId || '');
    }
  }, [user]);

  // Refresh profile on mount to guarantee freshest state from Aiven MySQL
  useEffect(() => {
    if (token) {
      refreshProfile(token);
    }
  }, [token]);

  // Handle Save Profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    // Validation
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        setFeedback({
          type: 'error',
          message: 'Mobile number must be exactly 10 digits.'
        });
        return;
      }
    }

    if (user?.role === 'Farmer') {
      if (!phone || phone.replace(/\D/g, '').length !== 10) {
        setFeedback({
          type: 'error',
          message: 'Valid 10-digit mobile number is mandatory for farmer gate pass notifications.'
        });
        return;
      }
      if (!village || village.trim().length === 0) {
        setFeedback({
          type: 'error',
          message: 'Village / Town name is mandatory for agricultural produce traceability.'
        });
        return;
      }
    }

    setLoading(true);
    try {
      if (updateUserProfile) {
        await updateUserProfile({
          name: fullName,
          phone: phone ? phone.replace(/\D/g, '') : null,
          village: village ? village.trim() : null,
          upiId: upiId ? upiId.trim() : null,
        });
      } else {
        const activeToken = token || localStorage.getItem('agrislot_token');
        await AgriSlotAPI.updateProfile({
          name: fullName,
          phone: phone ? phone.replace(/\D/g, '') : null,
          village: village ? village.trim() : null,
          upiId: upiId ? upiId.trim() : null,
        }, activeToken);
        await refreshProfile(activeToken);
      }

      setFeedback({
        type: 'success',
        message: 'Your APMC profile details have been saved and synchronized with the mandi database!'
      });
    } catch (err) {
      let errorMsg = err.message || 'Failed to update profile. Please try again.';
      if (errorMsg.includes('Resource not found') || errorMsg.includes('ROUTE_NOT_FOUND')) {
        errorMsg = 'Render Web Service is currently finishing the deployment of the new profile route. If you just deployed, click "Manual Deploy" -> "Deploy latest commit" on Render dashboard, wait 60 seconds, and retry.';
      }
      setFeedback({
        type: 'error',
        message: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  // If user is not authenticated
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-8 shadow-bento space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-mint-light text-forest mx-auto flex items-center justify-center border-2 border-navy-border">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-navy-border">
              Sign In to View Your Profile
            </h1>
            <p className="text-sm text-gray-600 mt-2 font-mono">
              Please log in with your Google account or AgriSlot credentials to access your profile settings.
            </p>
          </div>
          <button
            onClick={openLogin}
            className="px-6 py-3 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-sm uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-saffron" />
            <span>Sign In / Register</span>
          </button>
        </div>
      </div>
    );
  }

  const role = user.role || 'Farmer';
  const isFarmer = role === 'Farmer';
  const isOfficer = role === 'Mandi_Officer';
  const isAdmin = role === 'Admin';
  const isComplete = Boolean(user.isProfileComplete);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      
      {/* Warm Agricultural Welcome Banner */}
      {!welcomeDismissed && (noticeParam === 'welcome' || (!isComplete && isFarmer)) && (
        <div className="bg-amber-50/90 border-[2.5px] border-amber-500 rounded-bento p-5 shadow-bento animate-in fade-in duration-200 relative">
          <button
            type="button"
            onClick={() => setWelcomeDismissed(true)}
            className="absolute right-4 top-4 w-7 h-7 rounded-lg bg-white/80 hover:bg-white text-navy-border flex items-center justify-center border border-navy-border/30 text-xs font-bold transition-all hover:scale-105"
            title="Dismiss welcome message"
          >
            ✕
          </button>
          <div className="flex items-start gap-4 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-saffron text-navy-border flex items-center justify-center font-bold text-2xl border-2 border-navy-border shadow-bento-sm shrink-0">
              🌾
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="font-display font-black text-base sm:text-lg text-navy-border">
                  Welcome to the AgriSlot Family!
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-saffron/40 text-navy-border text-[10px] font-mono font-bold border border-navy-border/30">
                  🌱 Kisan Mitra
                </span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed max-w-3xl">
                We are glad to have you with us on Gujarat&apos;s smart agricultural marketplace. Manage your arrival slots with guaranteed entry, track fair digital weighing, and enjoy hassle-free direct mandi settlements for all your agricultural produce.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header Hero Card */}
      <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-6 shadow-bento flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-forest text-saffron flex items-center justify-center font-display font-black text-2xl border-2 border-navy-border shadow-bento-sm shrink-0 overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
            ) : (
              user.name ? user.name.slice(0, 2).toUpperCase() : 'AS'
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                isAdmin
                  ? 'bg-purple-100 text-purple-900 border-purple-400'
                  : isOfficer
                  ? 'bg-blue-100 text-blue-900 border-blue-400'
                  : 'bg-emerald-100 text-emerald-900 border-emerald-400'
              }`}>
                {isAdmin ? '🛡️ Super Administrator' : isOfficer ? '⚖️ Mandi Operations Officer' : '🌱 Registered Farmer'}
              </span>
              {user.provider === 'google' && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-blue-600 text-[10px] font-mono font-bold border border-slate-300">
                  Google Auth Verified
                </span>
              )}
              {isFarmer && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isComplete
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-400'
                }`}>
                  {isComplete ? '✓ Profile Complete' : '⚠️ Profile Details Incomplete'}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-navy-border">
              {user.name || user.username}
            </h1>
            <p className="text-xs text-gray-600 font-mono flex items-center gap-2 mt-1">
              <span>{user.email || user.username}</span>
              <span>•</span>
              <span>ID: #{user.userId}</span>
              {user.farmerId && (
                <>
                  <span>•</span>
                  <span className="font-bold text-forest">Farmer Ref: #FAR-{String(user.farmerId).padStart(4, '0')}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Button based on Role */}
        <div className="shrink-0 flex items-center gap-2">
          {isFarmer && (
            <Link
              href="/farmer"
              className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <Tractor className="w-3.5 h-3.5 text-saffron" />
              <span>Book Slot</span>
            </Link>
          )}
          {isOfficer && (
            <Link
              href="/admin?tab=verify"
              className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5 text-saffron" />
              <span>Gate Desk</span>
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-saffron" />
              <span>Admin Console</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Left Column Form, Right Column Role Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Edit Form Card (2 Columns Wide on Desktop) */}
        <div className="lg:col-span-2 bg-white rounded-bento border-[2.5px] border-navy-border p-6 shadow-bento space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-display font-black text-navy-border">
                {isFarmer ? 'Farmer Identification & Contact' : isOfficer ? 'Officer Staff Credentials' : 'Administrator Credentials'}
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Update your registered information in the APMC database.
              </p>
            </div>
            <span className="p-2 rounded-xl bg-mint-light text-forest border border-navy-border">
              <User className="w-4 h-4" />
            </span>
          </div>

          {feedback && (
            <div className={`p-4 rounded-xl border-2 flex items-start gap-3 font-mono text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                : 'bg-coral-light/40 border-coral text-coral-dark'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-coral-dark mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-mono font-bold text-navy-border uppercase tracking-wider mb-1.5">
                Full Legal Name <span className="text-coral">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Patel"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-navy-border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
                />
                <span className="absolute right-3 top-3 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Email Address (Read-Only) */}
            <div>
              <label className="block text-xs font-mono font-bold text-navy-border uppercase tracking-wider mb-1.5">
                Linked Email Account <span className="text-xs font-normal text-slate-500">(Google Verified)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user.email || 'No email attached'}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 font-mono text-xs bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <span className="absolute right-3 top-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Mobile Phone (10 digits) */}
            <div>
              <label className="block text-xs font-mono font-bold text-navy-border uppercase tracking-wider mb-1.5">
                Mobile Number (10 Digits) {isFarmer && <span className="text-coral">*</span>}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 font-mono text-xs font-bold text-slate-500">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  required={isFarmer}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9822014412"
                  className="w-full pl-12 pr-10 py-2.5 rounded-xl border-2 border-navy-border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
                />
                <span className="absolute right-3 top-3 text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-mono mt-1">
                Used to dispatch real-time SMS arrival tokens, QR codes, and weighbridge slips.
              </p>
            </div>

            {/* Farmer Specific Fields: Village & UPI */}
            {isFarmer && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-navy-border uppercase tracking-wider mb-1.5">
                      Village / Town <span className="text-coral">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        placeholder="e.g. Bardoli, Surat"
                        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-navy-border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
                      />
                      <span className="absolute right-3 top-3 text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-navy-border uppercase tracking-wider mb-1.5">
                      UPI ID for Mandi Payouts <span className="text-xs font-normal text-slate-500">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. 9822014412@upi"
                        className="w-full px-3.5 py-2.5 rounded-xl border-2 border-navy-border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-forest bg-white"
                      />
                      <span className="absolute right-3 top-3 text-slate-400">
                        <CreditCard className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Aadhaar Reference Badge (Masked UIDAI Compliance) */}
                <div>
                  <label className="block text-xs font-mono font-bold text-navy-border uppercase tracking-wider mb-1.5">
                    Aadhaar Verification Status <span className="text-xs font-normal text-slate-500">(Masked)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={user.aadharMasked || 'XXXX-XXXX-3490 (Verified UIDAI)'}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 font-mono text-xs bg-slate-50 text-slate-600 cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-3 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-mono mt-1">
                    Masked for your privacy under Indian Data Protection &amp; UIDAI guidelines.
                  </p>
                </div>
              </>
            )}

            {/* Officer Specific Fields: Staff ID and Shift */}
            {isOfficer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-navy-border uppercase tracking-wider mb-1.5">
                    Assigned Gate / Station
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Gate #1 — North Electronic Weighbridge"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 font-mono text-xs bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-navy-border uppercase tracking-wider mb-1.5">
                    Operational Shift
                  </label>
                  <input
                    type="text"
                    disabled
                    value="08:00 AM – 04:00 PM IST (Standard APMC)"
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 font-mono text-xs bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* Admin Specific Fields */}
            {isAdmin && (
              <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-900">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>Administrative Role: Master Registrar &amp; System Super-Admin</span>
                </div>
                <p className="text-[11px] text-purple-700 font-mono">
                  Full administrative authorization: RBAC access control, quota adjustments, weighbridge overrides, and database operations.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-saffron" />
                    <span>Save &amp; Synchronize Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Role-Specific Mandi Status Cards */}
        <div className="space-y-6">
          
          {/* Farmer Card */}
          {isFarmer && (
            <>
              <div className="bg-mint-foam/80 rounded-bento border-[2px] border-navy-border p-5 shadow-bento space-y-4">
                <div className="flex items-center gap-2 font-display font-black text-sm text-navy-border">
                  <Tractor className="w-4 h-4 text-forest" />
                  <span>Farmer APMC Pass Card</span>
                </div>
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between py-1.5 border-b border-navy-border/20">
                    <span className="text-gray-600">Farmer ID</span>
                    <span className="font-bold text-navy-border">#{String(user.farmerId || user.userId).padStart(4, '0')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-navy-border/20">
                    <span className="text-gray-600">Village / Yard</span>
                    <span className="font-bold text-navy-border">{user.village || 'Pending Update'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-navy-border/20">
                    <span className="text-gray-600">SMS Gate Alerts</span>
                    <span className="font-bold text-emerald-700">{user.phone ? '✓ Active' : '⚠️ Phone Missing'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-600">e-NAM Settlement</span>
                    <span className="font-bold text-navy-border">{user.upiId ? '✓ UPI Linked' : 'Cash / Counter'}</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Link
                    href="/farmer"
                    className="w-full py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border border-navy-border shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Book Arrival Slot</span>
                    <ArrowRight className="w-3.5 h-3.5 text-saffron" />
                  </Link>
                  <Link
                    href="/farmer?tab=history"
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 text-navy-border font-display font-black text-xs uppercase tracking-wider border border-navy-border shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>My Gate Passes</span>
                  </Link>
                </div>
              </div>

              {/* APMC Kisan Helpdesk */}
              <div className="bg-white rounded-bento border-[2px] border-navy-border p-5 shadow-bento space-y-2">
                <div className="font-mono text-[10px] font-bold text-forest uppercase tracking-wider">
                  MANDI GATE HELPLINE
                </div>
                <div className="font-display font-black text-base text-navy-border">
                  1800-233-0199
                </div>
                <p className="text-xs text-gray-600 font-mono">
                  For vehicle breakdown, gate rescheduling, or weighbridge assistance.
                </p>
              </div>
            </>
          )}

          {/* Mandi Officer Card */}
          {isOfficer && (
            <>
              <div className="bg-blue-50/80 rounded-bento border-[2px] border-navy-border p-5 shadow-bento space-y-4">
                <div className="flex items-center gap-2 font-display font-black text-sm text-navy-border">
                  <Scale className="w-4 h-4 text-blue-700" />
                  <span>Weighbridge Station Status</span>
                </div>
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between py-1.5 border-b border-navy-border/20">
                    <span className="text-gray-600">Staff Badge</span>
                    <span className="font-bold text-navy-border">OFF-#{String(user.userId).padStart(3, '0')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-navy-border/20">
                    <span className="text-gray-600">Station</span>
                    <span className="font-bold text-navy-border">Gate #1 (North WB)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-navy-border/20">
                    <span className="text-gray-600">Clearance Authority</span>
                    <span className="font-bold text-blue-700">Level 2 (Active)</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-600">Digital Scale Link</span>
                    <span className="font-bold text-emerald-700">✓ 60-Ton Platform Online</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Link
                    href="/admin?tab=verify"
                    className="w-full py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border border-navy-border shadow-sm flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-3.5 h-3.5 text-saffron" />
                    <span>Open Gate Desk</span>
                  </Link>
                  <Link
                    href="/admin?tab=bookings"
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 text-navy-border font-display font-black text-xs uppercase tracking-wider border border-navy-border shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Today's Arrival Queue</span>
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Admin Card */}
          {isAdmin && (
            <>
              <div className="bg-purple-50/80 rounded-bento border-[2px] border-navy-border p-5 shadow-bento space-y-4">
                <div className="flex items-center gap-2 font-display font-black text-sm text-navy-border">
                  <Server className="w-4 h-4 text-purple-700" />
                  <span>Cloud Infrastructure</span>
                </div>
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between py-1.5 border-b border-navy-border/20">
                    <span className="text-gray-600">Database Cluster</span>
                    <span className="font-bold text-emerald-700">Aiven Cloud MySQL 8.4</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-navy-border/20">
                    <span className="text-gray-600">Backend Web Service</span>
                    <span className="font-bold text-navy-border">Render Webhook (Port 5001)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-navy-border/20">
                    <span className="text-gray-600">Frontend Hosting</span>
                    <span className="font-bold text-navy-border">Vercel Production</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-600">Google OAuth API</span>
                    <span className="font-bold text-emerald-700">✓ GIS Verified</span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Link
                    href="/admin?tab=access"
                    className="w-full py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border border-navy-border shadow-sm flex items-center justify-center gap-2"
                  >
                    <Users className="w-3.5 h-3.5 text-saffron" />
                    <span>Manage User Roles (RBAC)</span>
                  </Link>
                  <Link
                    href="/admin?tab=slots"
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 text-navy-border font-display font-black text-xs uppercase tracking-wider border border-navy-border shadow-sm flex items-center justify-center gap-2"
                  >
                    <Layers className="w-3.5 h-3.5 text-forest" />
                    <span>Slot Capacity Manager</span>
                  </Link>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center font-mono font-bold text-gray-500">
        Loading APMC User Profile...
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
