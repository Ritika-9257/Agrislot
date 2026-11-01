'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Wheat, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  QrCode,
  ArrowRight,
  RefreshCw,
  Printer,
  Coffee,
  Check,
  Tractor,
  Layers,
  Sparkles,
  Lock,
  CalendarDays
} from 'lucide-react';
import { AgriSlotAPI } from '@/lib/api';
import GatePassModal from '@/components/GatePassModal';
import { useAuth } from '@/context/AuthContext';

// Standardized 20-minute operational time slots across APMC operating hours (9:00 AM - 5:00 PM)
const TIME_SLOTS_CONFIG = [
  // Morning Session (09:00 AM - 01:00 PM)
  { id: 'S01', startTime: '09:00:00', endTime: '09:20:00', label: '09:00 AM - 09:20 AM', session: 'morning' },
  { id: 'S02', startTime: '09:20:00', endTime: '09:40:00', label: '09:20 AM - 09:40 AM', session: 'morning' },
  { id: 'S03', startTime: '09:40:00', endTime: '10:00:00', label: '09:40 AM - 10:00 AM', session: 'morning' },
  { id: 'S04', startTime: '10:00:00', endTime: '10:20:00', label: '10:00 AM - 10:20 AM', session: 'morning' },
  { id: 'S05', startTime: '10:20:00', endTime: '10:40:00', label: '10:20 AM - 10:40 AM', session: 'morning' },
  { id: 'S06', startTime: '10:40:00', endTime: '11:00:00', label: '10:40 AM - 11:00 AM', session: 'morning' },
  { id: 'S07', startTime: '11:00:00', endTime: '11:20:00', label: '11:00 AM - 11:20 AM', session: 'morning' },
  { id: 'S08', startTime: '11:20:00', endTime: '11:40:00', label: '11:20 AM - 11:40 AM', session: 'morning' },
  { id: 'S09', startTime: '11:40:00', endTime: '12:00:00', label: '11:40 AM - 12:00 PM', session: 'morning' },
  { id: 'S10', startTime: '12:00:00', endTime: '12:20:00', label: '12:00 PM - 12:20 PM', session: 'morning' },
  { id: 'S11', startTime: '12:20:00', endTime: '12:40:00', label: '12:20 PM - 12:40 PM', session: 'morning' },
  { id: 'S12', startTime: '12:40:00', endTime: '13:00:00', label: '12:40 PM - 01:00 PM', session: 'morning' },

  // Afternoon Session (Resumes after 01:00 PM - 02:00 PM Lunch Break)
  { id: 'S13', startTime: '14:00:00', endTime: '14:20:00', label: '02:00 PM - 02:20 PM', session: 'afternoon' },
  { id: 'S14', startTime: '14:20:00', endTime: '14:40:00', label: '02:20 PM - 02:40 PM', session: 'afternoon' },
  { id: 'S15', startTime: '14:40:00', endTime: '15:00:00', label: '02:40 PM - 03:00 PM', session: 'afternoon' },
  { id: 'S16', startTime: '15:00:00', endTime: '15:20:00', label: '03:00 PM - 03:20 PM', session: 'afternoon' },
  { id: 'S17', startTime: '15:20:00', endTime: '15:40:00', label: '03:20 PM - 03:40 PM', session: 'afternoon' },
  { id: 'S18', startTime: '15:40:00', endTime: '16:00:00', label: '03:40 PM - 04:00 PM', session: 'afternoon' },
  { id: 'S19', startTime: '16:00:00', endTime: '16:20:00', label: '04:00 PM - 04:20 PM', session: 'afternoon' },
  { id: 'S20', startTime: '16:20:00', endTime: '16:40:00', label: '04:20 PM - 04:40 PM', session: 'afternoon' },
  { id: 'S21', startTime: '16:40:00', endTime: '17:00:00', label: '04:40 PM - 05:00 PM', session: 'afternoon' },
];

function FarmerPortalContent() {
  const { user, openLogin } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'book';
  const [activeTab, setActiveTab] = useState(initialTab); // 'book' | 'history'

  // Master Data
  const [mandis, setMandis] = useState([]);
  const [produceList, setProduceList] = useState([]);

  // Form State
  const [selectedMandiId, setSelectedMandiId] = useState('');
  const [selectedProduceId, setSelectedProduceId] = useState('');
  const [quantityTons, setQuantityTons] = useState(5);

  // Booking Date Selection
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookingDate, setBookingDate] = useState(todayStr);

  // Live Slots from MySQL for (Mandi_ID, Slot_Date)
  const [dbSlots, setDbSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null); // Real MySQL Slot_ID

  // Submission & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);
  const [showGatePassModal, setShowGatePassModal] = useState(false);

  // My Bookings Tab State
  const [myBookings, setMyBookings] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [cancelModal, setCancelModal] = useState({ open: false, booking: null });

  // Initial Load of Mandis and Produce
  useEffect(() => {
    async function loadMasterData() {
      try {
        const [mRes, pRes] = await Promise.allSettled([
          AgriSlotAPI.getMandis(),
          AgriSlotAPI.getProduce(),
        ]);

        if (mRes.status === 'fulfilled' && mRes.value?.data && mRes.value.data.length > 0) {
          setMandis(mRes.value.data);
          setSelectedMandiId(mRes.value.data[0].Mandi_ID);
        }
        if (pRes.status === 'fulfilled' && pRes.value?.data && pRes.value.data.length > 0) {
          setProduceList(pRes.value.data);
          setSelectedProduceId(pRes.value.data[0].Produce_ID);
        }
      } catch (err) {
        console.warn('Initial data load error:', err);
      }
    }
    loadMasterData();
    loadFarmerBookings();
  }, []);

  // Fetch Slots whenever selected Mandi or Booking Date changes
  useEffect(() => {
    if (!selectedMandiId || !bookingDate) return;

    async function loadSlots() {
      setLoadingSlots(true);
      try {
        const res = await AgriSlotAPI.getSlots({
          mandiId: selectedMandiId,
          date: bookingDate
        });
        if (res?.data && Array.isArray(res.data)) {
          setDbSlots(res.data);
          // Auto-select first available slot if nothing is selected or current selection is full
          const firstAvailable = res.data.find(s => Number(s.Remaining_Capacity_Tons) > 0);
          if (firstAvailable) {
            setSelectedSlotId(firstAvailable.Slot_ID);
          } else if (res.data.length > 0) {
            setSelectedSlotId(res.data[0].Slot_ID);
          }
        }
      } catch (err) {
        console.warn('Failed to load slots from database:', err);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [selectedMandiId, bookingDate]);

  // Load Farmer's Personal Bookings
  const loadFarmerBookings = async () => {
    const token = (user && user.token) || (typeof window !== 'undefined' ? localStorage.getItem('agrislot_token') : '');
    if (!token && !user) {
      setMyBookings([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await AgriSlotAPI.getAdminBookings(token || '', { limit: 50 }).catch(() => null);
      if (res?.data && Array.isArray(res.data)) {
        if (user?.farmerId) {
          const userBookings = res.data.filter(b => b.Farmer_ID === user.farmerId);
          setMyBookings(userBookings);
        } else {
          setMyBookings(res.data);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoadingHistory(false);
    }
  };

  // Re-fetch bookings when user session changes
  useEffect(() => {
    if (user) {
      loadFarmerBookings();
    }
  }, [user?.userId, user?.farmerId]);

  // Quick Date Select Helper
  const setQuickDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const dateStr = d.toISOString().split('T')[0];
    setBookingDate(dateStr);
  };

  // Handle Booking Cancellation (Capacity restoration in MySQL)
  const handleExecuteCancel = async () => {
    if (!cancelModal.booking) return;
    const bId = cancelModal.booking.Booking_ID;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('agrislot_token') : '';
      await AgriSlotAPI.cancelBooking(bId, token);
      setMyBookings(prev =>
        prev.map(b => (b.Booking_ID === bId ? { ...b, Booking_Status: 'Cancelled' } : b))
      );
      setCancelModal({ open: false, booking: null });
      if (selectedMandiId && bookingDate) {
        const res = await AgriSlotAPI.getSlots({ mandiId: selectedMandiId, date: bookingDate });
        if (res?.data) setDbSlots(res.data);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to cancel booking');
    }
  };

  // Handle Booking Submission
  const handleBookSlot = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      setErrorMessage('Farmer account required: Please sign in to verify your identity and confirm your arrival slot.');
      openLogin();
      return;
    }

    if (!selectedSlotId) {
      setErrorMessage('Please click and select an available GREEN time slot from the chart.');
      return;
    }

    const chosenSlot = dbSlots.find(s => s.Slot_ID === selectedSlotId);
    if (chosenSlot && Number(chosenSlot.Remaining_Capacity_Tons) <= 0) {
      setErrorMessage('This time slot is fully booked (RED). Please choose an available GREEN slot.');
      return;
    }

    setSubmitting(true);
    try {
      const token = (user && user.token) || (typeof window !== 'undefined' ? localStorage.getItem('agrislot_token') : '');

      if (!token) {
        setErrorMessage('Authentication session expired. Please sign in again.');
        openLogin();
        setSubmitting(false);
        return;
      }

      const payload = {
        Slot_ID: selectedSlotId,
        Produce_ID: Number(selectedProduceId) || 1,
        Estimated_Weight_Tons: Number(quantityTons) || 5
      };

      const res = await AgriSlotAPI.createBooking(payload, token);

      if (res?.data) {
        const created = res.data;
        const finalizedPass = {
          Booking_ID: created.bookingId || created.Booking_ID,
          Token_Number: created.tokenNumber || created.Token_Number,
          Gate_Pass_Token: created.tokenNumber || created.Token_Number,
          Farmer_Name: created.farmerName || user?.name || user?.username || 'Verified Farmer',
          Farmer_Phone: user?.phone || user?.email || 'N/A',
          Mandi_Name: created.mandiName || mandis.find(m => m.Mandi_ID === Number(selectedMandiId))?.Mandi_Name || 'APMC Mandi',
          Produce_Name: created.produceName || produceList.find(p => p.Produce_ID === Number(selectedProduceId))?.Produce_Name || 'Wheat',
          Estimated_Weight_Tons: Number(quantityTons),
          Slot_Date: created.slotDate || bookingDate,
          Start_Time: created.startTime || chosenSlot?.Start_Time || '09:00:00',
          End_Time: created.endTime || chosenSlot?.End_Time || '09:20:00',
          Booking_Status: 'Confirmed'
        };

        setMyBookings(prev => [finalizedPass, ...prev]);
        setSuccessBooking(finalizedPass);
        setShowGatePassModal(true);

        const updatedSlots = await AgriSlotAPI.getSlots({ mandiId: selectedMandiId, date: bookingDate });
        if (updatedSlots?.data) setDbSlots(updatedSlots.data);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to complete booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const morningConfigs = TIME_SLOTS_CONFIG.filter(s => s.session === 'morning');
  const afternoonConfigs = TIME_SLOTS_CONFIG.filter(s => s.session === 'afternoon');

  const getDbSlotForConfig = (cfg) => {
    return dbSlots.find(s => s.Start_Time === cfg.startTime);
  };

  const selectedSlotRecord = dbSlots.find(s => s.Slot_ID === selectedSlotId);
  const selectedConfig = TIME_SLOTS_CONFIG.find(c => c.startTime === selectedSlotRecord?.Start_Time);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Farmer Header Banner */}
      <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-6 shadow-bento flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-600 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Tractor className="w-3.5 h-3.5" /> Farmer Portal — Mandi Slot Allocation
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-navy-border">
            Book Arrival Time Slot
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Pick your arrival date, select an available <span className="font-bold text-emerald-700">GREEN</span> slot from the 20-minute chart, and get your Gate Pass Token.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 p-1.5 rounded-xl border-[1.5px] border-navy-border shadow-sm">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'book'
                ? 'bg-forest text-white shadow-sm'
                : 'text-gray-700 hover:text-navy-border'
            }`}
          >
            🌾 Book New Slot
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              loadFarmerBookings();
            }}
            className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'history'
                ? 'bg-forest text-white shadow-sm'
                : 'text-gray-700 hover:text-navy-border'
            }`}
          >
            📋 My Bookings ({myBookings.length})
          </button>
        </div>
      </div>

      {/* ONE FARMER IDENTITY CARD (MANDATORY REQUIREMENT) */}
      {user ? (
        <div className="bg-emerald-50 border-[2px] border-emerald-600 rounded-bento p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest text-saffron flex items-center justify-center font-bold border border-navy-border shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-700" /> Verified Registered Farmer Identity (Read-Only)
              </div>
              <div className="text-sm font-extrabold text-navy-border">
                {user.name || user.username}
                <span className="text-xs font-semibold text-gray-600 ml-2">
                  • Account: {user.email || user.username} • Farmer ID #{user.farmerId || 'Linked'}
                </span>
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-white text-emerald-800 font-mono text-[11px] font-bold border border-emerald-300">
            ✓ 1:1 Identity Bound
          </span>
        </div>
      ) : (
        <div className="bg-amber-50 border-[2px] border-amber-500 rounded-bento p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold border border-navy-border shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" /> Guest Mode — Not Logged In
              </div>
              <div className="text-sm font-extrabold text-navy-border">
                Please sign in to link your registered farmer profile and book arrival slots.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={openLogin}
            className="px-4 py-2 rounded-lg bg-forest text-saffron font-bold text-xs border border-navy-border shadow-sm hover:bg-forest-light transition-all flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Sign In with Farmer Account
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-4 text-rose-800 text-sm font-semibold flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: BOOK NEW SLOT INTERFACE                                            */}
      {/* ========================================================================= */}
      {activeTab === 'book' && (
        <form onSubmit={handleBookSlot} className="space-y-6">
          
          {/* STEP 1 & 2 CONTROLS: Mandi, Produce & DATE SELECTION */}
          <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-6 shadow-bento space-y-5">
            <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-black text-forest uppercase tracking-wider">Step 1 of 2</span>
                <h2 className="text-lg font-display font-black text-navy-border">Mandi, Commodity & Arrival Date</h2>
              </div>
              <div className="text-xs text-gray-500 font-semibold hidden sm:block">
                All slot capacities loaded directly from MySQL
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Mandi Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-forest" /> Arrival Mandi Yard
                </label>
                <select
                  value={selectedMandiId}
                  onChange={(e) => setSelectedMandiId(Number(e.target.value))}
                  className="w-full bg-gray-50 border-2 border-navy-border rounded-xl px-3.5 py-2.5 text-sm font-bold text-navy-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                >
                  {mandis.map((m) => (
                    <option key={m.Mandi_ID} value={m.Mandi_ID}>
                      {m.Mandi_Name} ({m.District || 'Gujarat'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Produce / Crop */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Wheat className="w-3.5 h-3.5 text-forest" /> Produce / Commodity
                </label>
                <select
                  value={selectedProduceId}
                  onChange={(e) => setSelectedProduceId(Number(e.target.value))}
                  className="w-full bg-gray-50 border-2 border-navy-border rounded-xl px-3.5 py-2.5 text-sm font-bold text-navy-border focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
                >
                  {produceList.map((p) => (
                    <option key={p.Produce_ID} value={p.Produce_ID}>
                      {p.Produce_Name} ({p.Category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimated Weight */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-forest" /> Estimated Delivery (Tons)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={quantityTons}
                  onChange={(e) => setQuantityTons(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-navy-border rounded-xl px-3.5 py-2 text-sm font-bold text-navy-border focus:bg-white focus:outline-none"
                  placeholder="e.g. 8.5"
                  required
                />
              </div>
            </div>

            {/* DEDICATED DATE SELECTION SECTION */}
            <div className="bg-mint-foam/50 border-2 border-emerald-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-black text-forest uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-emerald-700" /> Select Arrival Date (Choose date to reload slot chart)
                </label>
                
                {/* Quick Date Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      bookingDate === todayStr 
                        ? 'bg-forest text-white border-navy-border shadow-sm' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-navy-border'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-white text-gray-700 border border-gray-300 hover:border-navy-border transition-all"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(2)}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-white text-gray-700 border border-gray-300 hover:border-navy-border transition-all"
                  >
                    +2 Days
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="date"
                  min={todayStr}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="bg-white border-2 border-navy-border rounded-xl px-4 py-2 text-sm font-extrabold text-navy-border shadow-sm focus:outline-none focus:ring-2 focus:ring-forest cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-600">
                  Showing slots for: <span className="font-bold text-forest">{bookingDate}</span>
                </span>
              </div>
            </div>

          </div>

          {/* STEP 2: 20-MINUTE TIME-SLOTS BOX CHART (09:00 AM - 05:00 PM) */}
          <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-6 shadow-bento space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-gray-100 pb-4">
              <div>
                <span className="text-[11px] font-black text-forest uppercase tracking-wider">Step 2 of 2</span>
                <h2 className="text-xl font-display font-black text-navy-border">
                  20-Minute Arrival Time-Slot Chart
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Select a <span className="text-emerald-700 font-bold">🟢 GREEN</span> box to book. <span className="text-rose-700 font-bold">🔴 RED</span> boxes are fully booked.
                </p>
              </div>

              {/* Color Code Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-700 shadow-sm inline-block"></span>
                  <span className="text-gray-700">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-blue-600 border border-blue-800 shadow-sm inline-block"></span>
                  <span className="text-gray-700">Your Selection</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-rose-500 border border-rose-700 shadow-sm inline-block"></span>
                  <span className="text-gray-700">Booked / Full</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-gray-300 border border-gray-400 shadow-sm inline-block"></span>
                  <span className="text-gray-700">Lunch Break</span>
                </div>
              </div>
            </div>

            {loadingSlots ? (
              <div className="py-12 text-center text-sm font-bold text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-forest" />
                Querying slot capacity from MySQL...
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* MORNING SESSION: 09:00 AM - 01:00 PM */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] uppercase border border-amber-300">
                      🌅 Morning Session
                    </span>
                    <span className="text-xs font-bold text-gray-500">09:00 AM — 01:00 PM (12 Slots)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {morningConfigs.map((cfg) => {
                      const dbRow = getDbSlotForConfig(cfg);
                      const isBooked = dbRow ? Number(dbRow.Remaining_Capacity_Tons) <= 0 : false;
                      const isSelected = dbRow ? selectedSlotId === dbRow.Slot_ID : false;
                      const remainingTons = dbRow ? Number(dbRow.Remaining_Capacity_Tons) : 50;

                      return (
                        <button
                          key={cfg.id}
                          type="button"
                          disabled={isBooked}
                          onClick={() => {
                            if (dbRow) setSelectedSlotId(dbRow.Slot_ID);
                          }}
                          className={`p-3 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between h-24 ${
                            isSelected
                              ? 'bg-blue-600 border-navy-border text-white shadow-bento scale-[1.03] z-10'
                              : isBooked
                              ? 'bg-rose-50 border-rose-300 text-rose-800 opacity-75 cursor-not-allowed'
                              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-600 text-emerald-950 shadow-sm hover:scale-[1.02] cursor-pointer'
                          }`}
                        >
                          <div>
                            <div className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-75">
                              {cfg.id}
                            </div>
                            <div className="text-xs font-black mt-0.5 leading-snug">
                              {cfg.label.replace(' - ', ' to ')}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] font-extrabold">
                            {isSelected ? (
                              <span className="flex items-center gap-1 font-black bg-white text-blue-700 px-1.5 py-0.5 rounded">
                                <Check className="w-3 h-3" /> Selected
                              </span>
                            ) : isBooked ? (
                              <span className="text-rose-700 bg-rose-200 px-1.5 py-0.5 rounded text-[10px] font-black">
                                🔴 FULL
                              </span>
                            ) : (
                              <span className="text-emerald-800 bg-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-black">
                                🟢 {remainingTons.toFixed(1)}T Free
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* MANDI LUNCH BREAK RECESSED (01:00 PM - 02:00 PM) */}
                <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-2xl p-4 text-center space-y-1">
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-700">
                    <Coffee className="w-4 h-4 text-amber-700" />
                    Mandi Operational Lunch Recess (01:00 PM — 02:00 PM)
                  </div>
                  <p className="text-[11px] text-gray-500 font-semibold">
                    Yard gates are closed for weighbridge maintenance and staff lunch. No slot allocation available in this window.
                  </p>
                </div>

                {/* AFTERNOON SESSION: 02:00 PM - 05:00 PM */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-black text-[10px] uppercase border border-blue-300">
                      🌇 Afternoon Session
                    </span>
                    <span className="text-xs font-bold text-gray-500">02:00 PM — 05:00 PM (9 Slots)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {afternoonConfigs.map((cfg) => {
                      const dbRow = getDbSlotForConfig(cfg);
                      const isBooked = dbRow ? Number(dbRow.Remaining_Capacity_Tons) <= 0 : false;
                      const isSelected = dbRow ? selectedSlotId === dbRow.Slot_ID : false;
                      const remainingTons = dbRow ? Number(dbRow.Remaining_Capacity_Tons) : 50;

                      return (
                        <button
                          key={cfg.id}
                          type="button"
                          disabled={isBooked}
                          onClick={() => {
                            if (dbRow) setSelectedSlotId(dbRow.Slot_ID);
                          }}
                          className={`p-3 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between h-24 ${
                            isSelected
                              ? 'bg-blue-600 border-navy-border text-white shadow-bento scale-[1.03] z-10'
                              : isBooked
                              ? 'bg-rose-50 border-rose-300 text-rose-800 opacity-75 cursor-not-allowed'
                              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-600 text-emerald-950 shadow-sm hover:scale-[1.02] cursor-pointer'
                          }`}
                        >
                          <div>
                            <div className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-75">
                              {cfg.id}
                            </div>
                            <div className="text-xs font-black mt-0.5 leading-snug">
                              {cfg.label.replace(' - ', ' to ')}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] font-extrabold">
                            {isSelected ? (
                              <span className="flex items-center gap-1 font-black bg-white text-blue-700 px-1.5 py-0.5 rounded">
                                <Check className="w-3 h-3" /> Selected
                              </span>
                            ) : isBooked ? (
                              <span className="text-rose-700 bg-rose-200 px-1.5 py-0.5 rounded text-[10px] font-black">
                                🔴 FULL
                              </span>
                            ) : (
                              <span className="text-emerald-800 bg-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-black">
                                🟢 {remainingTons.toFixed(1)}T Free
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* SELECTION SUMMARY & CONFIRMATION BAR */}
            <div className="bg-mint-foam rounded-2xl border-2 border-navy-border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Chosen Arrival Window
                </span>
                <div className="text-base font-display font-black text-navy-border mt-0.5">
                  {selectedConfig ? selectedConfig.label : 'Select a slot from chart above'}
                </div>
                <div className="text-xs text-gray-600 font-semibold mt-0.5">
                  Date: <span className="font-bold text-navy-border">{bookingDate}</span> • Commodity: <span className="font-bold text-navy-border">{produceList.find(p => p.Produce_ID === Number(selectedProduceId))?.Produce_Name || 'Produce'}</span> • Weight: <span className="font-bold text-navy-border">{quantityTons} Tons</span>
                </div>
              </div>

              {user ? (
                <button
                  type="submit"
                  disabled={submitting || !selectedSlotId}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-sm border-2 border-navy-border shadow-bento flex items-center justify-center gap-2 transition-all active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-saffron" />
                      <span>Booking in MySQL...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Booking & Generate Gate Pass</span>
                      <ArrowRight className="w-4 h-4 text-saffron" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openLogin}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-black text-sm border-2 border-navy-border shadow-bento flex items-center justify-center gap-2 transition-all active:translate-x-[2px] active:translate-y-[2px]"
                >
                  <Lock className="w-4 h-4 text-white" />
                  <span>Log In to Confirm Booking</span>
                </button>
              )}
            </div>

          </div>

        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY BOOKINGS & DIGITAL PASSES                                       */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-6 shadow-bento space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-display font-black text-navy-border">
                  My Bookings & Gate Pass Tokens
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Present your unique Token Code upon arrival at the Mandi Gate for clearance.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by token, date..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border-2 border-navy-border rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {loadingHistory ? (
              <div className="py-12 text-center text-sm font-bold text-gray-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-forest mb-2" />
                Loading your bookings...
              </div>
            ) : !user ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl space-y-3">
                <Lock className="w-10 h-10 text-gray-400 mx-auto" />
                <div className="text-sm font-bold text-gray-700">Please sign in to view your Gate Pass Tokens and booking history.</div>
                <button
                  type="button"
                  onClick={openLogin}
                  className="px-4 py-2 bg-forest text-saffron rounded-lg text-xs font-bold border border-navy-border shadow-sm hover:bg-forest-light transition-all"
                >
                  Sign In with Farmer Account
                </button>
              </div>
            ) : myBookings.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl space-y-2">
                <Tractor className="w-10 h-10 text-gray-400 mx-auto" />
                <div className="text-sm font-bold text-gray-700">No bookings found yet.</div>
                <button
                  type="button"
                  onClick={() => setActiveTab('book')}
                  className="px-4 py-2 bg-forest text-saffron rounded-lg text-xs font-bold border border-navy-border"
                >
                  Book Your First Arrival Slot
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myBookings
                  .filter(b => {
                    if (!searchFilter) return true;
                    const q = searchFilter.toLowerCase();
                    const tok = (b.Token_Number || b.Gate_Pass_Token || '').toLowerCase();
                    const date = (b.Slot_Date || '').toLowerCase();
                    const prod = (b.Produce_Name || '').toLowerCase();
                    return tok.includes(q) || date.includes(q) || prod.includes(q);
                  })
                  .map((booking, idx) => {
                    const token = booking.Token_Number || booking.Gate_Pass_Token || `AG-T${booking.Booking_ID}`;
                    const status = booking.Booking_Status || 'Confirmed';

                    return (
                      <div
                        key={booking.Booking_ID || idx}
                        className="bg-white rounded-2xl border-2 border-navy-border p-5 shadow-sm space-y-3 relative hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                              Mandi Gate Token
                            </span>
                            <div className="text-xl font-mono font-black text-forest">
                              {token}
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${
                            status === 'Confirmed'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : status === 'Checked-In'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {status === 'Checked-In' ? 'In Process (Yard)' : status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100">
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Mandi Yard</span>
                            <span className="font-bold text-navy-border">{booking.Mandi_Name || 'APMC Surat'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Commodity</span>
                            <span className="font-bold text-navy-border">{booking.Produce_Name || 'Wheat'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Arrival Date</span>
                            <span className="font-bold text-navy-border">{booking.Slot_Date ? booking.Slot_Date.split('T')[0] : 'Today'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Time Window</span>
                            <span className="font-bold text-navy-border">
                              {booking.Start_Time ? `${booking.Start_Time.slice(0, 5)} - ${booking.End_Time.slice(0, 5)}` : '09:00 - 09:20'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => {
                              setSuccessBooking(booking);
                              setShowGatePassModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-mint-foam hover:bg-emerald-100 text-forest text-xs font-bold border border-emerald-300 flex items-center gap-1.5 shadow-sm"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>View / Print Pass</span>
                          </button>

                          {status === 'Confirmed' && (
                            <button
                              type="button"
                              onClick={() => setCancelModal({ open: true, booking })}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200"
                            >
                              Cancel Slot
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

          </div>

        </div>
      )}

      {/* GATE PASS MODAL */}
      {showGatePassModal && successBooking && (
        <GatePassModal
          booking={successBooking}
          onClose={() => setShowGatePassModal(false)}
        />
      )}

      {/* CANCELLATION CONFIRMATION MODAL */}
      {cancelModal.open && cancelModal.booking && (
        <div className="fixed inset-0 bg-navy-border/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-6 max-w-md w-full shadow-bento space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-display font-black text-navy-border">
                Cancel Arrival Slot?
              </h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to cancel booking token <span className="font-mono font-bold text-navy-border">{cancelModal.booking.Token_Number || cancelModal.booking.Gate_Pass_Token}</span>?
              This will automatically release the slot capacity back to the Mandi yard in MySQL.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModal({ open: false, booking: null })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 border border-gray-300"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleExecuteCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border border-rose-800 shadow-sm"
              >
                Yes, Cancel & Release
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function FarmerPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center font-bold text-gray-500">
        Loading Farmer Portal...
      </div>
    }>
      <FarmerPortalContent />
    </Suspense>
  );
}
