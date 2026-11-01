'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard,
  User, 
  MapPin, 
  Wheat, 
  Calendar, 
  Bell, 
  Clock, 
  Scale, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  LogOut, 
  ArrowRight, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft,
  Lock, 
  Phone, 
  FileText, 
  Check, 
  Building2, 
  Store, 
  Sprout, 
  CalendarCheck,
  ShieldAlert,
  LogIn,
  UserPlus,
  KeyRound,
  Plus,
  X,
  Trash2,
  Ban,
  Eye,
  CheckSquare,
  XCircle,
  AlertTriangle,
  CalendarClock,
  QrCode
} from 'lucide-react';
import { AgriSlotAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import GatePassModal from '@/components/GatePassModal';
import SmsNotificationModal from '@/components/SmsNotificationModal';

function FarmerPortalContent() {
  const { user, token, openLogin, openSignup, openSetupPassword, logout } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get('tab') : null;

  // Active view: 'overview' | 'profile' | 'mandis' | 'produce' | 'bookings' | 'notifications'
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');

  // Master Data & States
  const [profile, setProfile] = useState(null);
  const [mandis, setMandis] = useState([]);
  const [produceList, setProduceList] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Loading States
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingMandis, setLoadingMandis] = useState(false);
  const [loadingProduce, setLoadingProduce] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Errors & Banners
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters & Search
  const [mandiSearch, setMandiSearch] = useState('');
  const [mandiDistrictFilter, setMandiDistrictFilter] = useState('ALL');
  const [produceSearch, setProduceSearch] = useState('');
  const [produceCategoryFilter, setProduceCategoryFilter] = useState('ALL');

  // 4-Step Booking Workflow State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingMandi, setBookingMandi] = useState(null);
  const [bookingProduce, setProduceSelection] = useState(null);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [bookingWeight, setBookingWeight] = useState('');
  const [bookingSlotsList, setBookingSlotsList] = useState([]);
  const [loadingBookingSlots, setLoadingBookingSlots] = useState(false);
  const [bookingDateFilter, setBookingDateFilter] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [bookingAvailableOnly, setBookingAvailableOnly] = useState(true);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingModalError, setBookingModalError] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(true);

  // Gate Pass & SMS Modals State
  const [selectedBookingForPass, setSelectedBookingForPass] = useState(null);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);

  // Booking Cancellation State
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);

  // Sync tab from URL if present
  useEffect(() => {
    if (tabParam && ['overview', 'profile', 'mandis', 'produce', 'bookings', 'notifications'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Load Farmer Profile from Backend
  const loadProfile = async () => {
    if (!token) return;
    try {
      setLoadingProfile(true);
      const res = await AgriSlotAPI.getMyProfile(token);
      if (res && res.data) {
        setProfile(res.data);
      }
    } catch (err) {
      console.warn('Profile load notice:', err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Load Mandis from Live Database
  const loadMandis = async () => {
    try {
      setLoadingMandis(true);
      const res = await AgriSlotAPI.getMandis();
      if (res && res.data) {
        setMandis(res.data);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to fetch APMC Mandis from database');
    } finally {
      setLoadingMandis(false);
    }
  };

  // Load Produce Catalog from Live Database
  const loadProduce = async () => {
    try {
      setLoadingProduce(true);
      const res = await AgriSlotAPI.getProduce();
      if (res && res.data) {
        setProduceList(res.data);
      }
    } catch (err) {
      console.warn('Produce load notice:', err.message);
    } finally {
      setLoadingProduce(false);
    }
  };

  // Load Authenticated Farmer's Bookings
  const loadBookings = async () => {
    if (!token) return;
    try {
      setLoadingBookings(true);
      const res = await AgriSlotAPI.getMyBookings(token);
      if (res && res.data) {
        setBookings(res.data);
      }
    } catch (err) {
      console.warn('Bookings load notice:', err.message);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Load In-App Notifications
  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await AgriSlotAPI.getNotifications();
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.warn('Notifications load notice:', err.message);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Initial Load when authenticated
  useEffect(() => {
    if (user && token) {
      loadProfile();
      loadMandis();
      loadProduce();
      loadBookings();
      loadNotifications();
    }
  }, [user, token]);

  // Refresh All Data
  const handleRefreshAll = async () => {
    setRefreshing(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await Promise.allSettled([
        loadProfile(),
        loadMandis(),
        loadProduce(),
        loadBookings(),
        loadNotifications()
      ]);
      setSuccessMessage('Dashboard data refreshed successfully from live database.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } finally {
      setRefreshing(false);
    }
  };

  // Mark single notification as read
  const handleMarkNotificationRead = async (id) => {
    try {
      await AgriSlotAPI.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.Notification_ID === id ? { ...n, Is_Read: 1 } : n))
      );
    } catch (err) {
      console.warn('Error marking notification read:', err.message);
    }
  };

  // Extract available districts from actual mandi records
  const availableDistricts = useMemo(() => {
    const set = new Set();
    mandis.forEach((m) => {
      if (m.District) set.add(m.District.trim());
    });
    return Array.from(set).sort();
  }, [mandis]);

  // Extract available categories from actual produce records
  const availableCategories = useMemo(() => {
    const set = new Set();
    produceList.forEach((p) => {
      if (p.Category) set.add(p.Category.trim());
    });
    return Array.from(set).sort();
  }, [produceList]);

  // Filtered Mandis
  const filteredMandis = useMemo(() => {
    return mandis.filter((m) => {
      const matchSearch =
        !mandiSearch ||
        m.Mandi_Name?.toLowerCase().includes(mandiSearch.toLowerCase()) ||
        m.Location?.toLowerCase().includes(mandiSearch.toLowerCase()) ||
        m.District?.toLowerCase().includes(mandiSearch.toLowerCase());
      const matchDistrict =
        mandiDistrictFilter === 'ALL' ||
        m.District?.toLowerCase() === mandiDistrictFilter.toLowerCase();
      return matchSearch && matchDistrict;
    });
  }, [mandis, mandiSearch, mandiDistrictFilter]);

  // Filtered Produce
  const filteredProduce = useMemo(() => {
    return produceList.filter((p) => {
      const matchSearch =
        !produceSearch ||
        p.Produce_Name?.toLowerCase().includes(produceSearch.toLowerCase()) ||
        p.Category?.toLowerCase().includes(produceSearch.toLowerCase());
      const matchCategory =
        produceCategoryFilter === 'ALL' ||
        p.Category?.toLowerCase() === produceCategoryFilter.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [produceList, produceSearch, produceCategoryFilter]);

  // Farmer display fields
  const displayFarmerId = profile?.Farmer_ID !== undefined && profile?.Farmer_ID !== null
    ? profile.Farmer_ID
    : (user?.farmerId !== undefined && user?.farmerId !== null ? user.farmerId : null);

  const displayName = profile?.Name || user?.name || user?.username || 'Producer';
  const displayPhone = profile?.Phone || user?.phone || user?.username || 'N/A';
  const displayVillage = profile?.Village || user?.village || 'Local Yard';
  const displayAadhaar = profile?.Aadhar_No || 'XXXX-XXXX-XXXX';
  const displayUpi = profile?.UPI_ID || `${displayPhone}@upi`;

  // Dynamic Date Options for Booking Slots (Today, Tomorrow, Day After)
  const todayDateStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const tomorrowDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-CA');
  }, []);
  const dayAfterDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString('en-CA');
  }, []);

  // Fetch Slots when Mandi and Step 3 is activated
  const loadSlotsForMandi = async (mandiId, selectedDate, availableOnly) => {
    if (!mandiId) return;
    try {
      setLoadingBookingSlots(true);
      setBookingModalError('');
      const res = await AgriSlotAPI.getMandiSlots(mandiId, availableOnly);
      if (res && res.data) {
        // Filter out any past slots; match selectedDate if specified
        const validSlots = res.data.filter((s) => {
          const sDate = typeof s.Slot_Date === 'string' ? s.Slot_Date.slice(0, 10) : '';
          const notPast = sDate >= todayDateStr;
          const matchDate = selectedDate === 'ALL' || !selectedDate || sDate === selectedDate;
          return notPast && matchDate;
        });
        setBookingSlotsList(validSlots);
      }
    } catch (err) {
      setBookingModalError(err.message || 'Failed to fetch operational slots for selected Mandi');
    } finally {
      setLoadingBookingSlots(false);
    }
  };

  // Re-fetch slots if date filter or availableOnly toggle changes in Step 3
  useEffect(() => {
    if (showBookingModal && bookingStep === 3 && bookingMandi?.Mandi_ID) {
      loadSlotsForMandi(bookingMandi.Mandi_ID, bookingDateFilter, bookingAvailableOnly);
    }
  }, [showBookingModal, bookingStep, bookingMandi, bookingDateFilter, bookingAvailableOnly]);

  // Launch 4-Step Booking Workflow
  const openBookingWorkflow = (preselectedMandi = null, preselectedProduce = null) => {
    setBookingModalError('');
    setBookingMandi(preselectedMandi);
    setProduceSelection(preselectedProduce);
    setBookingSlot(null);
    setBookingWeight('');
    setBookingDateFilter(todayDateStr);
    setBookingAvailableOnly(true);

    if (preselectedMandi && preselectedProduce) {
      setBookingStep(3);
      loadSlotsForMandi(preselectedMandi.Mandi_ID, todayDateStr, true);
    } else if (preselectedMandi) {
      setBookingStep(2);
    } else {
      setBookingStep(1);
    }
    setShowBookingModal(true);
  };

  // Step 1 Selection Handler
  const handleSelectMandi = (m) => {
    setBookingMandi(m);
    setBookingSlot(null);
    setBookingStep(2);
  };

  // Step 2 Selection Handler
  const handleSelectProduce = (p) => {
    setProduceSelection(p);
    setBookingSlot(null);
    setBookingStep(3);
    loadSlotsForMandi(bookingMandi?.Mandi_ID, bookingDateFilter, bookingAvailableOnly);
  };

  // Step 3 Selection Handler
  const handleSelectSlot = (s) => {
    setBookingSlot(s);
    const rem = parseFloat(s.Remaining_Capacity_Tons || 0);
    // Suggest 5.0 Tons default or the remaining capacity if less
    setBookingWeight(rem >= 5 ? '5.0' : rem.toFixed(1));
    setBookingStep(4);
  };

  // Step 4: Submit Atomic Booking Request
  const handleCreateBooking = async () => {
    if (!bookingMandi || !bookingProduce || !bookingSlot) {
      setBookingModalError('Please complete all selection steps before confirming.');
      return;
    }
    const weightNum = parseFloat(bookingWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setBookingModalError('Please enter a valid estimated weight greater than 0 tons.');
      return;
    }
    const maxAllowed = parseFloat(bookingSlot.Remaining_Capacity_Tons || 0);
    if (weightNum > maxAllowed) {
      setBookingModalError(`Requested weight (${weightNum}T) exceeds available slot capacity (${maxAllowed.toFixed(2)}T).`);
      return;
    }
    if (!termsAgreed) {
      setBookingModalError('Please acknowledge arrival commitment before confirming reservation.');
      return;
    }

    try {
      setSubmittingBooking(true);
      setBookingModalError('');

      const payload = {
        Mandi_ID: bookingMandi.Mandi_ID,
        Produce_ID: bookingProduce.Produce_ID,
        Slot_ID: bookingSlot.Slot_ID,
        Estimated_Weight_Tons: weightNum
      };

      const res = await AgriSlotAPI.createBooking(payload, token);
      if (res && res.data) {
        setShowBookingModal(false);
        setSuccessMessage(`Arrival Window Confirmed! Official Gate-Pass Token: ${res.data.Token_Number || res.data.tokenNumber}`);
        setTimeout(() => setSuccessMessage(''), 8000);

        // Open GatePassModal with returned joined details
        setSelectedBookingForPass(res.data);
        setShowGatePassModal(true);

        // Auto-refresh farmer bookings and notifications
        loadBookings();
        loadNotifications();
      }
    } catch (err) {
      setBookingModalError(err.message || 'Slot reservation failed. The slot may have reached full capacity.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Booking Cancellation Flow
  const handleInitiateCancel = (b) => {
    setBookingToCancel(b);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    try {
      setCancellingLoading(true);
      setErrorMessage('');
      await AgriSlotAPI.cancelBooking(bookingToCancel.Booking_ID, token);
      setBookingToCancel(null);
      setSuccessMessage(
        `Booking #${bookingToCancel.Booking_ID} (${bookingToCancel.Token_Number}) successfully cancelled. ${bookingToCancel.Estimated_Weight_Tons} Tons capacity restored.`
      );
      setTimeout(() => setSuccessMessage(''), 6000);
      loadBookings();
      loadNotifications();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingLoading(false);
    }
  };

  // View Existing Gate Pass
  const handleViewGatePass = (booking) => {
    setSelectedBookingForPass(booking);
    setShowGatePassModal(true);
  };

  // ==========================================
  // VIEW A: ROUTE PROTECTION (UNAUTHENTICATED)
  // ==========================================
  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in duration-300">
        <div className="bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg overflow-hidden">
          {/* Top Pill Banner */}
          <div className="px-6 py-4 bg-mint-foam border-b-[2px] border-navy-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-forest text-saffron border-[1.5px] border-navy-border flex items-center justify-center font-display font-black text-sm shadow-[1.5px_1.5px_0px_#0F2B20]">
                AS
              </div>
              <div>
                <span className="font-display font-black text-sm text-navy-border tracking-tight block">
                  AgriSlot Portal
                </span>
                <span className="font-mono text-[10px] font-bold text-forest uppercase tracking-wider">
                  Access Protected
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-coral/40 text-coral-dark text-[10px] font-mono font-bold border border-navy-border flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span>Authentication Required</span>
            </span>
          </div>

          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-mint-light border-[2px] border-navy-border flex items-center justify-center mx-auto shadow-bento-sm">
              <ShieldAlert className="w-8 h-8 text-forest" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-display font-black text-navy-border tracking-tight">
                Farmer Dashboard Gate
              </h1>
              <p className="text-xs text-slate-600 font-mono max-w-md mx-auto leading-relaxed">
                Please sign in with your registered 10-digit mobile number and passcode to view your profile, explore APMC Mandi capacities, and book guaranteed arrival slots.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left font-mono text-[11px] space-y-1.5 text-slate-600">
              <div className="font-bold text-navy-border flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-forest" />
                <span>Zero-Trust Producer Security</span>
              </div>
              <p className="leading-relaxed">
                AgriSlot enforces strict identity isolation. Only verified producers can create bookings, view gate-passes, and release reserved slot capacities.
              </p>
            </div>

            {/* Login & Register CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={openLogin}
                className="w-full py-3 px-4 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-saffron" />
                <span>Sign In with Passcode</span>
              </button>

              <button
                type="button"
                onClick={openSignup}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-mint-foam text-navy-border font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4 text-forest" />
                <span>New Registration</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={openSetupPassword}
                className="text-xs font-mono font-bold text-forest hover:underline inline-flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Forgot passcode or need to set up new credentials?</span>
              </button>
            </div>
          </div>

          <div className="px-6 py-3 bg-canvas border-t border-slate-200 text-center font-mono text-[10px] font-bold text-slate-500">
            Official APMC e-NAM Mandi Gateway • End-to-End Encrypted Session
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW B: AUTHENTICATED FARMER DASHBOARD
  // ==========================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER & PRODUCER BADGE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b-[2.5px] border-navy-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint-foam border-[1.5px] border-navy-border text-xs font-mono font-bold text-forest mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
            <span>APMC PRODUCER DISPATCH DESK</span>
          </div>
          <h1 className="text-3xl font-display font-black text-navy-border tracking-tight flex items-center gap-3">
            <span>Farmer Dashboard</span>
            {displayFarmerId ? (
              <span className="text-xs font-mono font-bold bg-forest text-saffron px-2.5 py-1 rounded-lg border border-navy-border shadow-sm">
                Farmer ID #{displayFarmerId}
              </span>
            ) : (
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-300">
                Demo Profile
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-mono mt-1">
            Welcome back, <strong className="text-navy-border">{displayName}</strong> • Registered Mobile: <strong className="text-navy-border">{displayPhone}</strong> • Village: <strong className="text-navy-border">{displayVillage}</strong>
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => openBookingWorkflow()}
            className="py-2.5 px-4 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-saffron" />
            <span>Book Arrival Slot</span>
          </button>

          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-mint-foam border-[2px] border-navy-border font-mono text-xs font-bold text-navy-border shadow-bento-sm active:translate-y-0.5 transition-all flex items-center gap-1.5"
            title="Refresh dashboard data from live database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-forest' : 'text-slate-600'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-2.5 rounded-xl bg-coral/30 hover:bg-coral/60 border-[2px] border-navy-border font-mono text-xs font-bold text-coral-dark shadow-bento-sm active:translate-y-0.5 transition-all flex items-center gap-1.5"
            title="Sign out of AgriSlot"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Staff View Notice if logged in as Admin/Officer */}
      {user.role && user.role !== 'Farmer' && (
        <div className="p-3.5 rounded-2xl bg-saffron-light border-[2px] border-navy-border text-navy-border text-xs font-mono font-bold flex items-center justify-between shadow-bento-sm">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-forest shrink-0" />
            <span>Staff Mode: Signed in as APMC {user.role} ({user.name}). Viewing Farmer Portal in preview mode.</span>
          </div>
          <Link
            href="/admin"
            className="px-3 py-1 bg-forest text-white rounded-lg hover:bg-forest-light transition-colors text-[11px] font-bold"
          >
            Return to Admin Desk &rarr;
          </Link>
        </div>
      )}

      {/* Status Messages */}
      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-coral/60 border-[2px] border-navy-border text-coral-dark text-xs font-mono font-bold flex items-center justify-between shadow-bento-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="font-bold text-sm">
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-mint-light border-[2px] border-navy-border text-forest text-xs font-mono font-bold flex items-center justify-between shadow-bento-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="font-bold text-sm">
            &times;
          </button>
        </div>
      )}

      {/* 2. DASHBOARD NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 bg-canvas rounded-2xl border-[2px] border-navy-border shadow-bento-sm overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'profile', label: 'My Profile', icon: User },
          { id: 'mandis', label: 'Browse Mandis', icon: Store, count: mandis.length },
          { id: 'produce', label: 'Browse Produce', icon: Wheat, count: produceList.length },
          { id: 'bookings', label: 'My Bookings', icon: CalendarCheck, count: bookings.length },
          { id: 'notifications', label: 'Notifications', icon: Bell, count: notifications.filter(n => !n.Is_Read).length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setErrorMessage('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-forest text-white shadow-bento-sm'
                  : 'text-navy-border hover:bg-mint-foam'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-saffron' : 'text-slate-600'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                    isActive
                      ? 'bg-saffron text-navy-border font-bold'
                      : 'bg-mint-foam text-forest border border-navy-border'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW                                         */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Welcome Bento Hero */}
          <div className="p-6 bg-mint-foam rounded-bento border-[2px] border-navy-border shadow-bento flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-navy-border text-[11px] font-mono font-bold text-forest">
                <ShieldCheck className="w-3.5 h-3.5 text-forest" />
                <span>Verified Agricultural Producer</span>
              </div>
              <h2 className="text-2xl font-display font-black text-navy-border tracking-tight">
                {displayName}
              </h2>
              <p className="text-xs font-mono text-slate-600 max-w-xl leading-relaxed">
                Producer Account linked to <strong>{displayVillage}</strong>. You have real-time access to {mandis.length} APMC Mandis and {produceList.length} registered commodities with instant gate-pass issuance.
              </p>
            </div>

            <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openBookingWorkflow()}
                className="py-2.5 px-4 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <CalendarClock className="w-3.5 h-3.5 text-saffron" />
                <span>Book Arrival Slot</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-navy-border font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <CalendarCheck className="w-3.5 h-3.5 text-forest" />
                <span>View My Bookings ({bookings.length})</span>
              </button>
            </div>
          </div>

          {/* 4 Metric Bento Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Farmer ID */}
            <div 
              onClick={() => setActiveTab('profile')}
              className="p-5 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento hover:-translate-y-0.5 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-500 uppercase">Producer ID</span>
                <div className="w-8 h-8 rounded-xl bg-mint-light text-forest border border-navy-border flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-display font-black text-2xl text-navy-border">
                  {displayFarmerId ? `#${displayFarmerId}` : 'Demo'}
                </div>
                <div className="font-mono text-[11px] text-slate-500 mt-0.5 truncate">
                  Village: {displayVillage}
                </div>
              </div>
            </div>

            {/* Card 2: Mandis Count */}
            <div 
              onClick={() => setActiveTab('mandis')}
              className="p-5 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento hover:-translate-y-0.5 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-500 uppercase">APMC Mandis</span>
                <div className="w-8 h-8 rounded-xl bg-saffron-light text-navy-border border border-navy-border flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-display font-black text-2xl text-navy-border">
                  {mandis.length}
                </div>
                <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                  Across {availableDistricts.length || 'multiple'} districts
                </div>
              </div>
            </div>

            {/* Card 3: Produce Varieties */}
            <div 
              onClick={() => setActiveTab('produce')}
              className="p-5 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento hover:-translate-y-0.5 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-500 uppercase">Produce Catalog</span>
                <div className="w-8 h-8 rounded-xl bg-mint-foam text-forest border border-navy-border flex items-center justify-center">
                  <Wheat className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-display font-black text-2xl text-navy-border">
                  {produceList.length}
                </div>
                <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                  {availableCategories.length} agricultural categories
                </div>
              </div>
            </div>

            {/* Card 4: My Bookings */}
            <div 
              onClick={() => setActiveTab('bookings')}
              className="p-5 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento hover:-translate-y-0.5 transition-all cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-500 uppercase">My Bookings</span>
                <div className="w-8 h-8 rounded-xl bg-coral/30 text-coral-dark border border-navy-border flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="font-display font-black text-2xl text-navy-border">
                  {bookings.length}
                </div>
                <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                  {bookings.length > 0 ? 'Active arrival windows' : 'No bookings scheduled'}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Mandis Preview */}
          <div className="p-6 bg-white rounded-bento border-[2px] border-navy-border shadow-bento space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-black text-navy-border tracking-tight flex items-center gap-2">
                  <Store className="w-5 h-5 text-forest" />
                  <span>Available APMC Mandis</span>
                </h3>
                <p className="text-xs font-mono text-slate-500">
                  Select any yard to reserve an arrival slot or view daily throughput capacity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('mandis')}
                className="text-xs font-mono font-bold text-forest hover:underline flex items-center gap-1"
              >
                <span>View All ({mandis.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingMandis ? (
              <div className="py-8 text-center font-mono text-xs text-slate-500 animate-pulse">
                Loading Mandi network from database...
              </div>
            ) : mandis.length === 0 ? (
              <div className="p-6 bg-canvas rounded-xl text-center font-mono text-xs text-slate-500">
                No mandis available in database.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mandis.slice(0, 3).map((m) => (
                  <div
                    key={m.Mandi_ID}
                    className="p-4 rounded-xl border border-navy-border bg-canvas hover:bg-mint-foam/50 transition-colors space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-display font-black text-sm text-navy-border">
                          {m.Mandi_Name}
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white text-forest border border-navy-border font-mono text-[10px] font-bold shrink-0">
                          {m.District}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{m.Location}</span>
                      </div>
                      <div className="text-[11px] font-mono text-forest font-bold">
                        {Number(m.Total_Daily_Capacity_Tons).toFixed(0)} Tons / Day
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openBookingWorkflow(m)}
                      className="w-full py-1.5 px-3 rounded-lg bg-forest hover:bg-forest-light text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-saffron" />
                      <span>Book Slot Here</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MY PROFILE                                       */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-bento border-[2px] border-navy-border shadow-bento space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-mint-light border-[2px] border-navy-border flex items-center justify-center font-display font-black text-xl text-forest shadow-bento-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-display font-black text-navy-border tracking-tight">
                    {displayName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 font-mono text-xs text-slate-500">
                    <span>Verified APMC Producer</span>
                    <span>•</span>
                    <span className="font-bold text-forest">Active Status</span>
                  </div>
                </div>
              </div>

              <span className="px-3 py-1.5 rounded-xl bg-forest text-saffron border border-navy-border font-mono text-xs font-bold self-start sm:self-auto">
                Farmer ID #{displayFarmerId || 'N/A'}
              </span>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-canvas rounded-xl border border-slate-200 space-y-1">
                <span className="font-mono text-xs text-slate-500 block">Full Legal Name</span>
                <span className="font-display font-black text-base text-navy-border block">
                  {displayName}
                </span>
              </div>

              <div className="p-4 bg-canvas rounded-xl border border-slate-200 space-y-1">
                <span className="font-mono text-xs text-slate-500 block">Registered Mobile Number</span>
                <span className="font-mono font-bold text-base text-navy-border flex items-center gap-2">
                  <Phone className="w-4 h-4 text-forest" />
                  <span>{displayPhone}</span>
                </span>
              </div>

              <div className="p-4 bg-canvas rounded-xl border border-slate-200 space-y-1">
                <span className="font-mono text-xs text-slate-500 block">Native Village / Jurisdiction</span>
                <span className="font-display font-bold text-base text-navy-border flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-forest" />
                  <span>{displayVillage}</span>
                </span>
              </div>

              <div className="p-4 bg-canvas rounded-xl border border-slate-200 space-y-1">
                <span className="font-mono text-xs text-slate-500 block">Aadhaar Identification (Masked)</span>
                <span className="font-mono font-bold text-base text-navy-border flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-forest" />
                  <span>{displayAadhaar}</span>
                </span>
              </div>

              <div className="p-4 bg-canvas rounded-xl border border-slate-200 space-y-1 md:col-span-2">
                <span className="font-mono text-xs text-slate-500 block">Direct e-NAM Payment UPI ID</span>
                <span className="font-mono font-bold text-base text-navy-border flex items-center gap-2">
                  <Scale className="w-4 h-4 text-forest" />
                  <span>{displayUpi}</span>
                </span>
              </div>
            </div>

            {/* Identity Safeguard Note */}
            <div className="p-4 rounded-xl bg-mint-foam border border-navy-border text-xs font-mono space-y-1 text-slate-700">
              <div className="font-bold text-forest flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-forest" />
                <span>e-NAM Zero-Trust Identity Protection</span>
              </div>
              <p className="leading-relaxed">
                Your profile information is securely isolated in the AgriSlot database. Only dispatch slots and transactions matching your verified Farmer ID (#{displayFarmerId}) are accessible during this session.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: BROWSE MANDIS                                    */}
      {/* ======================================================== */}
      {activeTab === 'mandis' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-4 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={mandiSearch}
                onChange={(e) => setMandiSearch(e.target.value)}
                placeholder="Search by mandi name, location..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-mint-light/40 border border-navy-border text-navy-border font-bold focus:ring-0 focus:border-forest text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <span className="text-slate-500 font-bold shrink-0">District:</span>
              <button
                type="button"
                onClick={() => setMandiDistrictFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg border font-bold text-[11px] whitespace-nowrap transition-colors ${
                  mandiDistrictFilter === 'ALL'
                    ? 'bg-forest text-white border-navy-border'
                    : 'bg-canvas text-navy-border border-slate-300 hover:bg-mint-foam'
                }`}
              >
                All ({mandis.length})
              </button>
              {availableDistricts.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setMandiDistrictFilter(d)}
                  className={`px-3 py-1.5 rounded-lg border font-bold text-[11px] whitespace-nowrap transition-colors ${
                    mandiDistrictFilter.toLowerCase() === d.toLowerCase()
                      ? 'bg-forest text-white border-navy-border'
                      : 'bg-canvas text-navy-border border-slate-300 hover:bg-mint-foam'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Mandis List */}
          {loadingMandis ? (
            <div className="py-16 text-center font-mono text-xs text-slate-500 animate-pulse">
              Retrieving live APMC Mandi database records...
            </div>
          ) : filteredMandis.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-bento border-[2px] border-navy-border shadow-bento space-y-3">
              <Store className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="font-display font-black text-lg text-navy-border">No Mandis Found</div>
              <p className="text-xs font-mono text-slate-500 max-w-sm mx-auto">
                No active APMC Mandi yards matched your search or district filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMandiSearch('');
                  setMandiDistrictFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-forest text-white font-mono text-xs font-bold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMandis.map((m) => (
                <div
                  key={m.Mandi_ID}
                  className="p-5 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento transition-all space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-display font-black text-base text-navy-border leading-tight">
                          {m.Mandi_Name}
                        </h4>
                        <div className="flex items-center gap-1 font-mono text-xs text-slate-500 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{m.Location}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-mint-foam text-forest border border-navy-border font-mono text-[10px] font-bold shrink-0">
                        {m.District}
                      </span>
                    </div>

                    <div className="p-3 bg-canvas rounded-xl border border-slate-200 font-mono text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Total Daily Capacity:</span>
                        <strong className="text-forest font-bold">
                          {Number(m.Total_Daily_Capacity_Tons).toFixed(0)} Tons
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Mandi Yard ID:</span>
                        <span className="font-bold text-navy-border">APMC-{m.Mandi_ID}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openBookingWorkflow(m)}
                    className="w-full py-2.5 px-3 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-3.5 h-3.5 text-saffron" />
                    <span>Book Arrival Slot</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: BROWSE PRODUCE                                   */}
      {/* ======================================================== */}
      {activeTab === 'produce' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-4 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={produceSearch}
                onChange={(e) => setProduceSearch(e.target.value)}
                placeholder="Search produce, commodities..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-mint-light/40 border border-navy-border text-navy-border font-bold focus:ring-0 focus:border-forest text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <span className="text-slate-500 font-bold shrink-0">Category:</span>
              <button
                type="button"
                onClick={() => setProduceCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg border font-bold text-[11px] whitespace-nowrap transition-colors ${
                  produceCategoryFilter === 'ALL'
                    ? 'bg-forest text-white border-navy-border'
                    : 'bg-canvas text-navy-border border-slate-300 hover:bg-mint-foam'
                }`}
              >
                All ({produceList.length})
              </button>
              {availableCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setProduceCategoryFilter(c)}
                  className={`px-3 py-1.5 rounded-lg border font-bold text-[11px] whitespace-nowrap transition-colors ${
                    produceCategoryFilter.toLowerCase() === c.toLowerCase()
                      ? 'bg-forest text-white border-navy-border'
                      : 'bg-canvas text-navy-border border-slate-300 hover:bg-mint-foam'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Produce List */}
          {loadingProduce ? (
            <div className="py-16 text-center font-mono text-xs text-slate-500 animate-pulse">
              Loading produce catalog from database...
            </div>
          ) : filteredProduce.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-bento border-[2px] border-navy-border shadow-bento space-y-3">
              <Wheat className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="font-display font-black text-lg text-navy-border">No Produce Found</div>
              <p className="text-xs font-mono text-slate-500 max-w-sm mx-auto">
                No agricultural commodities matched your search criteria.
              </p>
              <button
                type="button"
                onClick={() => {
                  setProduceSearch('');
                  setProduceCategoryFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-forest text-white font-mono text-xs font-bold"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredProduce.map((p) => (
                <div
                  key={p.Produce_ID}
                  className="p-5 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-mint-light text-forest border border-navy-border flex items-center justify-center font-bold text-xs">
                        <Sprout className="w-4 h-4" />
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-canvas text-navy-border border border-slate-300 font-mono text-[10px] font-bold">
                        {p.Category}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-display font-black text-base text-navy-border leading-tight">
                        {p.Produce_Name}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500 mt-0.5 block">
                        Commodity ID #{p.Produce_ID}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-[11px]">
                      <span className="text-slate-500">Storage Class:</span>
                      <span className={`font-bold px-2 py-0.5 rounded border ${
                        p.Storage_Type === 'Cold'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : p.Storage_Type === 'Dry'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-mint-foam text-forest border-navy-border'
                      }`}>
                        {p.Storage_Type || 'Ambient'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openBookingWorkflow(null, p)}
                    className="w-full py-2 px-3 rounded-xl bg-canvas hover:bg-mint-foam text-navy-border font-mono text-xs font-bold border border-navy-border transition-all flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5 text-forest" />
                    <span>Book with this Crop</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: MY BOOKINGS                                      */}
      {/* ======================================================== */}
      {activeTab === 'bookings' && (
        <div className="space-y-5">
          <div className="p-4 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-display font-black text-navy-border tracking-tight flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-forest" />
                <span>My Booked Arrival Windows</span>
              </h3>
              <p className="text-xs font-mono text-slate-500">
                Live database reservations tied to your Farmer ID (#{displayFarmerId || 'N/A'}).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openBookingWorkflow()}
                className="px-3.5 py-1.5 rounded-xl bg-forest hover:bg-forest-light text-white font-mono text-xs font-bold flex items-center gap-1.5 border border-navy-border shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-saffron" />
                <span>+ Book Arrival Slot</span>
              </button>

              <button
                type="button"
                onClick={loadBookings}
                disabled={loadingBookings}
                className="px-3 py-1.5 rounded-xl bg-canvas hover:bg-mint-foam border border-navy-border font-mono text-xs font-bold text-navy-border flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingBookings ? 'animate-spin text-forest' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {loadingBookings ? (
            <div className="py-16 text-center font-mono text-xs text-slate-500 animate-pulse">
              Querying database for bookings tied to Farmer ID #{displayFarmerId}...
            </div>
          ) : bookings.length === 0 ? (
            /* Empty State with CTA */
            <div className="p-12 text-center bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-mint-light border-[2px] border-navy-border flex items-center justify-center mx-auto shadow-bento-sm">
                <CalendarCheck className="w-8 h-8 text-forest" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-display font-black text-navy-border tracking-tight">
                  No Active or Scheduled Bookings
                </h4>
                <p className="text-xs font-mono text-slate-600 max-w-md mx-auto leading-relaxed">
                  You currently have no scheduled arrival windows or gate passes registered with any APMC Mandi.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => openBookingWorkflow()}
                  className="py-3 px-6 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-saffron" />
                  <span>Reserve Your First Mandi Arrival Slot</span>
                </button>
              </div>
            </div>
          ) : (
            /* Real Bookings Table */
            <div className="bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-mint-foam border-b-[2px] border-navy-border text-slate-700 uppercase text-[10.5px]">
                    <tr>
                      <th className="py-3 px-4">Token Number</th>
                      <th className="py-3 px-4">Mandi Yard</th>
                      <th className="py-3 px-4">Produce</th>
                      <th className="py-3 px-4">Date &amp; Time Window</th>
                      <th className="py-3 px-4">Weight (Tons)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.map((b) => {
                      const isConfirmed = b.Booking_Status === 'Confirmed';
                      const isCheckedIn = b.Booking_Status === 'Checked-In';
                      const isCompleted = b.Booking_Status === 'Completed';

                      return (
                        <tr key={b.Booking_ID} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold">
                            <button
                              type="button"
                              onClick={() => handleViewGatePass(b)}
                              className="text-forest hover:underline font-bold inline-flex items-center gap-1 group"
                              title="Click to view full Gate-Pass Slip"
                            >
                              <span>{b.Token_Number}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-forest" />
                            </button>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-navy-border">
                            <div>{b.Mandi_Name}</div>
                            {b.District && (
                              <div className="text-[10px] text-slate-400 font-normal">{b.District}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div>{b.Produce_Name}</div>
                            {b.Category && (
                              <div className="text-[10px] text-slate-400">{b.Category}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-navy-border">
                              {b.Slot_Date ? new Date(b.Slot_Date).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="text-[10.5px] text-slate-500">
                              {b.Start_Time ? `${b.Start_Time.slice(0, 5)} - ${b.End_Time ? b.End_Time.slice(0, 5) : ''}` : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-navy-border">
                            {Number(b.Estimated_Weight_Tons).toFixed(2)} T
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                              isConfirmed
                                ? 'bg-mint-foam text-forest border-navy-border'
                                : isCheckedIn
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : isCompleted
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-coral/20 text-coral-dark border-coral/30'
                            }`}>
                              {b.Booking_Status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleViewGatePass(b)}
                                className="px-2.5 py-1 rounded-lg bg-mint-light hover:bg-mint-foam border border-navy-border text-forest font-bold text-[10.5px] flex items-center gap-1 shadow-sm transition-all"
                                title="View & Print Official Gate Pass"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Gate Pass</span>
                              </button>

                              {isConfirmed && (
                                <button
                                  type="button"
                                  onClick={() => handleInitiateCancel(b)}
                                  className="px-2.5 py-1 rounded-lg bg-coral/20 hover:bg-coral/50 border border-coral text-coral-dark font-bold text-[10.5px] flex items-center gap-1 transition-all"
                                  title="Cancel booking and release slot capacity"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>Cancel</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: NOTIFICATIONS                                    */}
      {/* ======================================================== */}
      {activeTab === 'notifications' && (
        <div className="space-y-5">
          <div className="p-4 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-display font-black text-navy-border tracking-tight flex items-center gap-2">
                <Bell className="w-4 h-4 text-forest" />
                <span>Producer In-App Notifications</span>
              </h3>
              <p className="text-xs font-mono text-slate-500">
                Official SMS and system alerts regarding gate arrivals, weighbridge logs, and APMC clearances.
              </p>
            </div>

            <button
              type="button"
              onClick={loadNotifications}
              disabled={loadingNotifications}
              className="px-3.5 py-1.5 rounded-xl bg-canvas hover:bg-mint-foam border border-navy-border font-mono text-xs font-bold text-navy-border flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingNotifications ? 'animate-spin text-forest' : ''}`} />
              <span>Refresh Alerts</span>
            </button>
          </div>

          {loadingNotifications ? (
            <div className="py-16 text-center font-mono text-xs text-slate-500 animate-pulse">
              Loading in-app alerts from database...
            </div>
          ) : notifications.length === 0 ? (
            /* Proper Empty State: No fake notifications */
            <div className="p-12 text-center bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-mint-light border-[2px] border-navy-border flex items-center justify-center mx-auto shadow-bento-sm">
                <Bell className="w-8 h-8 text-forest" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-display font-black text-navy-border tracking-tight">
                  No Notifications
                </h4>
                <p className="text-xs font-mono text-slate-600 max-w-md mx-auto leading-relaxed">
                  You are completely caught up! New dispatch tokens, gate clearance alerts, and Mandi announcements will be delivered to this inbox.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.Notification_ID}
                  className={`p-4 rounded-2xl border-[2px] border-navy-border transition-all flex items-start justify-between gap-4 ${
                    n.Is_Read ? 'bg-white shadow-bento-sm' : 'bg-mint-foam/80 shadow-bento'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-navy-border">{n.Title}</span>
                      {!n.Is_Read && (
                        <span className="px-2 py-0.2 bg-forest text-saffron text-[9.5px] font-mono font-bold rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-600 leading-relaxed">
                      {n.Message}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400 block pt-1">
                      {n.Created_At ? new Date(n.Created_At).toLocaleString() : 'Recent alert'}
                    </span>
                  </div>

                  {!n.Is_Read && (
                    <button
                      type="button"
                      onClick={() => handleMarkNotificationRead(n.Notification_ID)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-navy-border text-[10.5px] font-mono font-bold text-navy-border shrink-0 shadow-sm"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4-STEP MANDI SLOT BOOKING MODAL                          */}
      {/* ======================================================== */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-mint-foam border-b-[2px] border-navy-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot"></span>
                  <span className="font-mono text-xs font-black text-forest uppercase tracking-wider">
                    APMC Guaranteed Arrival Reservation
                  </span>
                </div>
                <h3 className="text-lg font-display font-black text-navy-border tracking-tight mt-0.5">
                  Book Mandi Slot &amp; Gate-Pass
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-coral/30 border border-navy-border flex items-center justify-center text-slate-500 hover:text-coral-dark transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Wizard Progress Bar */}
            <div className="grid grid-cols-4 bg-canvas border-b-[2px] border-navy-border font-mono text-[11px] text-center">
              {[
                { num: 1, label: 'Select Mandi' },
                { num: 2, label: 'Select Produce' },
                { num: 3, label: 'Pick Slot' },
                { num: 4, label: 'Weight & Confirm' },
              ].map((s) => {
                const isCurrent = bookingStep === s.num;
                const isCompleted = bookingStep > s.num;
                return (
                  <div
                    key={s.num}
                    className={`py-2.5 px-1 border-r border-slate-200 last:border-r-0 flex items-center justify-center gap-1.5 transition-colors ${
                      isCurrent
                        ? 'bg-forest text-white font-bold'
                        : isCompleted
                        ? 'bg-mint-light text-forest font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-saffron text-navy-border'
                        : isCompleted
                        ? 'bg-forest text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isCompleted ? '✓' : s.num}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Error Banner inside Modal */}
            {bookingModalError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-coral/50 border border-coral text-coral-dark font-mono text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingModalError}</span>
                </div>
                <button onClick={() => setBookingModalError('')} className="font-bold text-sm">
                  &times;
                </button>
              </div>
            )}

            {/* Modal Scrollable Content Area */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* STEP 1: SELECT MANDI */}
              {bookingStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-black text-base text-navy-border">
                        Step 1: Choose APMC Mandi Yard
                      </h4>
                      <p className="font-mono text-xs text-slate-500">
                        Select which market yard will receive and weigh your agricultural consignment.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {mandis.length} Mandis Available
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                    {mandis.map((m) => {
                      const isSelected = bookingMandi?.Mandi_ID === m.Mandi_ID;
                      return (
                        <div
                          key={m.Mandi_ID}
                          onClick={() => handleSelectMandi(m)}
                          className={`p-4 rounded-xl border-[2px] cursor-pointer transition-all space-y-1.5 ${
                            isSelected
                              ? 'border-forest bg-mint-foam shadow-bento-sm'
                              : 'border-slate-200 bg-white hover:border-forest/50 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-display font-black text-sm text-navy-border">
                              {m.Mandi_Name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-white text-forest border border-navy-border font-mono text-[9.5px] font-bold">
                              {m.District}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{m.Location}</span>
                          </div>
                          <div className="text-[11px] font-mono text-forest font-bold pt-1">
                            Daily Capacity: {Number(m.Total_Daily_Capacity_Tons).toFixed(0)} Tons
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: SELECT PRODUCE */}
              {bookingStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-display font-black text-base text-navy-border">
                        Step 2: Select Agricultural Produce
                      </h4>
                      <p className="font-mono text-xs text-slate-500">
                        Selected Mandi: <strong className="text-forest">{bookingMandi?.Mandi_Name}</strong> ({bookingMandi?.District})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="text-xs font-mono font-bold text-slate-500 hover:text-navy-border flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Change Mandi</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                    {produceList.map((p) => {
                      const isSelected = bookingProduce?.Produce_ID === p.Produce_ID;
                      return (
                        <div
                          key={p.Produce_ID}
                          onClick={() => handleSelectProduce(p)}
                          className={`p-4 rounded-xl border-[2px] cursor-pointer transition-all space-y-1.5 ${
                            isSelected
                              ? 'border-forest bg-mint-foam shadow-bento-sm'
                              : 'border-slate-200 bg-white hover:border-forest/50 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-display font-black text-sm text-navy-border">
                              {p.Produce_Name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-canvas text-navy-border border border-slate-300 font-mono text-[9.5px] font-bold">
                              {p.Category}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-500 flex items-center justify-between pt-1">
                            <span>Storage Class:</span>
                            <strong className="text-navy-border">{p.Storage_Type || 'Ambient'}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: PICK OPERATIONAL SLOT */}
              {bookingStep === 3 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-display font-black text-base text-navy-border">
                        Step 3: Pick Arrival Slot &amp; Window
                      </h4>
                      <p className="font-mono text-xs text-slate-500">
                        {bookingMandi?.Mandi_Name} • {bookingProduce?.Produce_Name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBookingStep(2)}
                      className="text-xs font-mono font-bold text-slate-500 hover:text-navy-border flex items-center gap-1 self-start sm:self-auto"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Produce</span>
                    </button>
                  </div>

                  {/* Date Filter Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-canvas rounded-xl border border-slate-200 font-mono text-xs">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <span className="text-slate-500 font-bold shrink-0">Date:</span>
                      {[
                        { label: 'Today', date: todayDateStr },
                        { label: 'Tomorrow', date: tomorrowDateStr },
                        { label: 'Day +2', date: dayAfterDateStr },
                        { label: 'All Upcoming', date: 'ALL' }
                      ].map((d) => (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => setBookingDateFilter(d.date)}
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-colors ${
                            bookingDateFilter === d.date
                              ? 'bg-forest text-white'
                              : 'bg-white text-navy-border border border-slate-200 hover:bg-mint-foam'
                          }`}
                        >
                          {d.label} {d.date !== 'ALL' && `(${d.date.slice(5)})`}
                        </button>
                      ))}
                    </div>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 font-bold">
                      <input
                        type="checkbox"
                        checked={bookingAvailableOnly}
                        onChange={(e) => setBookingAvailableOnly(e.target.checked)}
                        className="rounded border-slate-300 text-forest focus:ring-0"
                      />
                      <span>Available Only</span>
                    </label>
                  </div>

                  {/* Slots Grid */}
                  {loadingBookingSlots ? (
                    <div className="py-12 text-center font-mono text-xs text-slate-500 animate-pulse">
                      Retrieving live operational slots for {bookingMandi?.Mandi_Name}...
                    </div>
                  ) : bookingSlotsList.length === 0 ? (
                    <div className="p-8 text-center bg-canvas rounded-xl border border-slate-200 space-y-2">
                      <CalendarClock className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="font-display font-black text-sm text-navy-border">No Slots Found</div>
                      <p className="font-mono text-xs text-slate-500">
                        No operational slots matched this date or filter. Try switching to Tomorrow or All Upcoming.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                      {bookingSlotsList.map((s) => {
                        const isSelected = bookingSlot?.Slot_ID === s.Slot_ID;
                        const maxCap = parseFloat(s.Max_Capacity_Tons || 0);
                        const bookedCap = parseFloat(s.Booked_Capacity_Tons || 0);
                        const remCap = parseFloat(s.Remaining_Capacity_Tons !== undefined ? s.Remaining_Capacity_Tons : (maxCap - bookedCap));
                        const isFull = remCap <= 0 || s.Availability_Status === 'Full';
                        const percentFilled = maxCap > 0 ? Math.min(100, (bookedCap / maxCap) * 100) : 0;

                        return (
                          <div
                            key={s.Slot_ID}
                            onClick={() => !isFull && handleSelectSlot(s)}
                            className={`p-4 rounded-xl border-[2px] transition-all space-y-2 ${
                              isFull
                                ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'border-forest bg-mint-foam shadow-bento-sm cursor-pointer'
                                : 'border-slate-200 bg-white hover:border-forest/50 hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-display font-black text-sm text-navy-border flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-forest" />
                                <span>{s.Start_Time.slice(0, 5)} - {s.End_Time.slice(0, 5)}</span>
                              </span>

                              <span className={`px-2 py-0.5 rounded-full font-mono text-[9.5px] font-bold border ${
                                isFull
                                  ? 'bg-slate-200 text-slate-600 border-slate-300'
                                  : 'bg-mint-light text-forest border-navy-border'
                              }`}>
                                {isFull ? 'SLOT FULL' : `${remCap.toFixed(1)}T AVAILABLE`}
                              </span>
                            </div>

                            <div className="font-mono text-xs text-slate-500">
                              Date: <strong className="text-navy-border">{typeof s.Slot_Date === 'string' ? s.Slot_Date.slice(0, 10) : new Date(s.Slot_Date).toLocaleDateString()}</strong>
                            </div>

                            {/* Capacity Visual Progress Bar */}
                            <div className="space-y-1 pt-1 font-mono text-[10px]">
                              <div className="flex justify-between text-slate-500">
                                <span>Utilization: {percentFilled.toFixed(0)}%</span>
                                <span>{bookedCap.toFixed(1)} / {maxCap.toFixed(0)} Tons</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${percentFilled > 80 ? 'bg-amber-500' : 'bg-emerald-600'}`}
                                  style={{ width: `${percentFilled}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: ESTIMATED WEIGHT & CONFIRMATION */}
              {bookingStep === 4 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-display font-black text-base text-navy-border">
                        Step 4: Consignment Weight &amp; Gate-Pass Review
                      </h4>
                      <p className="font-mono text-xs text-slate-500">
                        Review reservation itinerary before locking weighbridge capacity.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBookingStep(3)}
                      className="text-xs font-mono font-bold text-slate-500 hover:text-navy-border flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Slots</span>
                    </button>
                  </div>

                  {/* Review Bento Summary */}
                  <div className="p-4 bg-canvas rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10.5px]">PRODUCER</span>
                      <strong className="text-navy-border block mt-0.5 truncate">{displayName}</strong>
                      <span className="text-[10px] text-slate-500">ID #{displayFarmerId || 'N/A'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10.5px]">APMC MANDI</span>
                      <strong className="text-navy-border block mt-0.5 truncate">{bookingMandi?.Mandi_Name}</strong>
                      <span className="text-[10px] text-slate-500">{bookingMandi?.District}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10.5px]">COMMODITY</span>
                      <strong className="text-navy-border block mt-0.5 truncate">{bookingProduce?.Produce_Name}</strong>
                      <span className="text-[10px] text-slate-500">{bookingProduce?.Storage_Type || 'Ambient'}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10.5px]">TIME WINDOW</span>
                      <strong className="text-forest block mt-0.5">
                        {bookingSlot?.Start_Time?.slice(0, 5)} - {bookingSlot?.End_Time?.slice(0, 5)}
                      </strong>
                      <span className="text-[10px] text-slate-500">
                        {typeof bookingSlot?.Slot_Date === 'string' ? bookingSlot?.Slot_Date.slice(0, 10) : ''}
                      </span>
                    </div>
                  </div>

                  {/* Weight Input Box */}
                  <div className="p-4 bg-white rounded-xl border-[2px] border-navy-border shadow-bento-sm space-y-3 font-mono">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-navy-border flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-forest" />
                        <span>Estimated Weight to Arrive (in Metric Tons)</span>
                      </label>

                      <span className="text-xs text-slate-500">
                        Max Allowed: <strong className="text-forest font-bold">{Number(bookingSlot?.Remaining_Capacity_Tons || 0).toFixed(2)} Tons</strong>
                      </span>
                    </div>

                    {/* Quick Tonnage Selectors */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {[2.0, 5.0, 10.0, 15.0].map((tVal) => {
                        const rem = parseFloat(bookingSlot?.Remaining_Capacity_Tons || 0);
                        if (tVal > rem) return null;
                        return (
                          <button
                            key={tVal}
                            type="button"
                            onClick={() => setBookingWeight(tVal.toFixed(1))}
                            className={`px-3 py-1 rounded-lg border font-bold text-[11px] transition-colors ${
                              parseFloat(bookingWeight) === tVal
                                ? 'bg-forest text-white border-navy-border'
                                : 'bg-canvas text-navy-border border-slate-200 hover:bg-mint-foam'
                            }`}
                          >
                            {tVal} Tons
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setBookingWeight(parseFloat(bookingSlot?.Remaining_Capacity_Tons || 0).toFixed(1))}
                        className="px-3 py-1 rounded-lg bg-mint-light text-forest border border-navy-border font-bold text-[11px] hover:bg-mint-foam transition-colors"
                      >
                        Max ({Number(bookingSlot?.Remaining_Capacity_Tons || 0).toFixed(1)}T)
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max={bookingSlot?.Remaining_Capacity_Tons || 50}
                        value={bookingWeight}
                        onChange={(e) => setBookingWeight(e.target.value)}
                        placeholder="Enter weight in tons (e.g. 5.5)"
                        className="w-full h-12 px-4 rounded-xl border-[2px] border-navy-border font-mono text-base font-bold text-navy-border focus:ring-0 focus:border-forest"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        Metric Tons ({parseFloat(bookingWeight) > 0 ? (parseFloat(bookingWeight) * 1000).toLocaleString() : 0} KG)
                      </span>
                    </div>

                    {/* Live Validation Guidance */}
                    {parseFloat(bookingWeight) > parseFloat(bookingSlot?.Remaining_Capacity_Tons || 0) ? (
                      <p className="text-xs font-bold text-coral-dark flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Weight exceeds available capacity ({Number(bookingSlot?.Remaining_Capacity_Tons).toFixed(2)}T). Please lower your declared tonnage.</span>
                      </p>
                    ) : parseFloat(bookingWeight) > 0 ? (
                      <p className="text-xs font-bold text-forest flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Capacity check passed. Will reserve {parseFloat(bookingWeight).toFixed(2)} Tons atomically in the APMC database.</span>
                      </p>
                    ) : null}
                  </div>

                  {/* Commitment Terms Checkbox */}
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-mint-foam border border-navy-border font-mono text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="mt-0.5 rounded border-navy-border text-forest focus:ring-0"
                    />
                    <span className="leading-relaxed">
                      I confirm this agricultural produce belongs to Farmer ID #{displayFarmerId} and will arrive at Gate 02 weighbridge during the assigned time window.
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="px-6 py-4 bg-canvas border-t-[2px] border-navy-border flex items-center justify-between">
              {bookingStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setBookingStep((s) => s - 1)}
                  disabled={submittingBooking}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border-[1.5px] border-navy-border font-mono text-xs font-bold text-navy-border transition-colors flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>
              ) : (
                <div />
              )}

              {bookingStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (bookingStep === 1 && !bookingMandi) {
                      setBookingModalError('Please choose an APMC Mandi to continue.');
                      return;
                    }
                    if (bookingStep === 2 && !bookingProduce) {
                      setBookingModalError('Please select a commodity to continue.');
                      return;
                    }
                    if (bookingStep === 3 && !bookingSlot) {
                      setBookingModalError('Please choose a time slot to continue.');
                      return;
                    }
                    setBookingModalError('');
                    setBookingStep((s) => s + 1);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateBooking}
                  disabled={submittingBooking || parseFloat(bookingWeight) <= 0 || parseFloat(bookingWeight) > parseFloat(bookingSlot?.Remaining_Capacity_Tons || 0)}
                  className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-light disabled:opacity-50 text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all flex items-center gap-2"
                >
                  {submittingBooking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-saffron" />
                      <span>Reserving Capacity &amp; Issuing Token...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-saffron" />
                      <span>Confirm &amp; Generate Gate Pass</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CANCELLATION CONFIRMATION MODAL                          */}
      {/* ======================================================== */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-coral/30 border border-coral text-coral-dark flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-navy-border leading-tight">
                  Cancel Arrival Reservation?
                </h3>
                <span className="font-mono text-xs text-slate-500">
                  Token: <strong>{bookingToCancel.Token_Number}</strong>
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-canvas rounded-xl border border-slate-200 font-mono text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Market Yard:</span>
                <strong className="text-navy-border">{bookingToCancel.Mandi_Name}</strong>
              </div>
              <div className="flex justify-between">
                <span>Commodity:</span>
                <strong className="text-navy-border">{bookingToCancel.Produce_Name}</strong>
              </div>
              <div className="flex justify-between">
                <span>Reserved Tonnage:</span>
                <strong className="text-forest">{Number(bookingToCancel.Estimated_Weight_Tons).toFixed(2)} Tons</strong>
              </div>
            </div>

            <p className="font-mono text-xs text-slate-600 leading-relaxed">
              Cancelling this booking will immediately revoke Gate-Pass <strong>{bookingToCancel.Token_Number}</strong> and atomically release {bookingToCancel.Estimated_Weight_Tons} Tons of capacity back to the Mandi schedule.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                disabled={cancellingLoading}
                className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border-[1.5px] border-navy-border font-mono text-xs font-bold text-navy-border transition-colors"
              >
                No, Keep Booking
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancellingLoading}
                className="py-2.5 px-4 rounded-xl bg-coral hover:bg-coral-dark text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
              >
                {cancellingLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Releasing...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Confirm Cancellation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* POPUP: GATE PASS MODAL                                   */}
      {/* ======================================================== */}
      {showGatePassModal && selectedBookingForPass && (
        <GatePassModal
          booking={selectedBookingForPass}
          onClose={() => setShowGatePassModal(false)}
          onOpenSms={() => setShowSmsModal(true)}
        />
      )}

      {/* ======================================================== */}
      {/* POPUP: SMS NOTIFICATION MODAL                            */}
      {/* ======================================================== */}
      {showSmsModal && selectedBookingForPass && (
        <SmsNotificationModal
          booking={selectedBookingForPass}
          onClose={() => setShowSmsModal(false)}
          onOpenGatePass={() => setShowGatePassModal(true)}
        />
      )}

    </div>
  );
}

export default function FarmerPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto py-24 text-center font-mono text-xs text-slate-500 space-y-2 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-forest border-t-transparent animate-spin mx-auto"></div>
        <div>Loading AgriSlot Producer Portal...</div>
      </div>
    }>
      <FarmerPortalContent />
    </Suspense>
  );
}
