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
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  QrCode,
  ArrowRight,
  Filter,
  RefreshCw,
  Scale,
  MessageSquare
} from 'lucide-react';
import { AgriSlotAPI } from '@/lib/api';
import GatePassModal from '@/components/GatePassModal';
import SmsNotificationModal from '@/components/SmsNotificationModal';
import { useAuth } from '@/context/AuthContext';

function FarmerPortalContent() {
  const { user, openLogin, openSignup } = useAuth();
  const searchParams = useSearchParams();
  const urlMandiId = searchParams.get('mandiId');
  const [activeTab, setActiveTab] = useState('book');

  // Master Data
  const [mandis, setMandis] = useState([]);
  const [produceList, setProduceList] = useState([]);
  const [farmers, setFarmers] = useState([]);

  // Booking Form State
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [selectedMandiId, setSelectedMandiId] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedProduceId, setSelectedProduceId] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState('');

  // New Farmer Registration Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newFarmer, setNewFarmer] = useState({
    Full_Name: '',
    Phone_Number: '',
    Aadhaar_Number: '',
    UPI_ID: '',
    Village: '',
    District: '',
    State: 'Gujarat',
  });

  // Generated Gate-Pass Modal & SMS Notification Modal State
  const [activePassBooking, setActivePassBooking] = useState(null);
  const [smsModalBooking, setSmsModalBooking] = useState(null);

  // History / Lookup Tab State
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [farmerBookings, setFarmerBookings] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initial Load
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        const [mandisRes, produceRes, farmersRes] = await Promise.allSettled([
          AgriSlotAPI.getMandis(),
          AgriSlotAPI.getProduce(),
          AgriSlotAPI.getFarmers(),
        ]);

        if (mandisRes.status === 'fulfilled' && mandisRes.value?.data) {
          setMandis(mandisRes.value.data);
          if (urlMandiId && mandisRes.value.data.some((m) => m.Mandi_ID === Number(urlMandiId))) {
            setSelectedMandiId(Number(urlMandiId));
          } else if (mandisRes.value.data.length > 0) {
            setSelectedMandiId(mandisRes.value.data[0].Mandi_ID);
          }
        }
        if (produceRes.status === 'fulfilled' && produceRes.value?.data) {
          setProduceList(produceRes.value.data);
          if (produceRes.value.data.length > 0) {
            setSelectedProduceId(produceRes.value.data[0].Produce_ID);
          }
        }
        if (farmersRes.status === 'fulfilled' && farmersRes.value?.data) {
          setFarmers(farmersRes.value.data);
          if (farmersRes.value.data.length > 0) {
            setSelectedFarmerId(farmersRes.value.data[0].Farmer_ID);
          }
        }
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load master data');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [urlMandiId]);

  // When Mandi Changes, Load Slots
  useEffect(() => {
    if (!selectedMandiId) {
      setSlots([]);
      return;
    }

    async function loadSlots() {
      try {
        setLoadingSlots(true);
        const res = await AgriSlotAPI.getMandiSlots(Number(selectedMandiId));
        if (res.data) {
          setSlots(res.data);
          const firstAvailable = res.data.find((s) => s.Remaining_Capacity_Tons > 0);
          if (firstAvailable) {
            setSelectedSlotId(firstAvailable.Slot_ID);
          } else if (res.data.length > 0) {
            setSelectedSlotId(res.data[0].Slot_ID);
          } else {
            setSelectedSlotId('');
          }
        }
      } catch (err) {
        console.warn('Slot load error:', err.message);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [selectedMandiId]);

  // Handle Booking Creation
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedFarmerId) {
      setErrorMessage('Please select or register a farmer');
      return;
    }
    if (!selectedSlotId) {
      setErrorMessage('Please select an available slot window');
      return;
    }
    if (!selectedProduceId) {
      setErrorMessage('Please select a produce item');
      return;
    }
    if (!estimatedWeight || Number(estimatedWeight) <= 0) {
      setErrorMessage('Please enter a valid estimated weight in tons');
      return;
    }

    // Check capacity locally
    const slotObj = slots.find((s) => s.Slot_ID === Number(selectedSlotId));
    if (slotObj && Number(estimatedWeight) > slotObj.Remaining_Capacity_Tons) {
      setErrorMessage(
        `Weight exceeds slot capacity. Remaining: ${slotObj.Remaining_Capacity_Tons} Tons.`
      );
      return;
    }

    try {
      setLoading(true);
      const res = await AgriSlotAPI.createBooking({
        Farmer_ID: Number(selectedFarmerId),
        Slot_ID: Number(selectedSlotId),
        Produce_ID: Number(selectedProduceId),
        Estimated_Weight_Tons: Number(estimatedWeight),
      });

      if (res.data) {
        setSuccessMessage('Slot booked successfully! Gate-pass slip generated.');
        setActivePassBooking(res.data);
        if (selectedMandiId) {
          const updatedSlots = await AgriSlotAPI.getMandiSlots(Number(selectedMandiId));
          setSlots(updatedSlots.data || []);
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Booking submission failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle New Farmer Registration
  const handleRegisterFarmer = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await AgriSlotAPI.registerFarmer(newFarmer);
      if (res.data) {
        const createdFarmer = res.data;
        setFarmers((prev) => [createdFarmer, ...prev]);
        setSelectedFarmerId(createdFarmer.Farmer_ID);
        setShowRegisterModal(false);
        setSuccessMessage(`Producer ${newFarmer.Full_Name} registered successfully!`);
        setNewFarmer({
          Full_Name: '',
          Phone_Number: '',
          Aadhaar_Number: '',
          UPI_ID: '',
          Village: '',
          District: '',
          State: 'Gujarat',
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Farmer registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Booking Cancellation
  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking? Slot capacity will be restored immediately.')) {
      return;
    }
    try {
      setLoading(true);
      await AgriSlotAPI.cancelBooking(bookingId);
      setSuccessMessage(`Booking #${bookingId} has been cancelled and slot capacity restored.`);
      if (selectedFarmerId) {
        const res = await AgriSlotAPI.getFarmerBookings(Number(selectedFarmerId));
        setFarmerBookings(res.data || []);
      }
      if (selectedMandiId) {
        const updatedSlots = await AgriSlotAPI.getMandiSlots(Number(selectedMandiId));
        setSlots(updatedSlots.data || []);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  // Search History by Farmer ID or Token
  const handleSearchHistory = async () => {
    if (!historySearchQuery.trim()) {
      if (selectedFarmerId) {
        loadFarmerHistory(Number(selectedFarmerId));
      }
      return;
    }

    try {
      setLoadingHistory(true);
      setErrorMessage('');
      if (historySearchQuery.trim().toUpperCase().startsWith('AG-T')) {
        const res = await AgriSlotAPI.getBookingByToken(historySearchQuery.trim());
        if (res.data) {
          setFarmerBookings([res.data]);
        }
      } else {
        const fId = parseInt(historySearchQuery.trim(), 10);
        if (!isNaN(fId)) {
          const res = await AgriSlotAPI.getFarmerBookings(fId);
          setFarmerBookings(res.data || []);
        } else {
          setErrorMessage('Please enter a valid Token (AG-T...) or numeric Farmer ID');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'No matching bookings found');
      setFarmerBookings([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadFarmerHistory = async (farmerId) => {
    try {
      setLoadingHistory(true);
      const res = await AgriSlotAPI.getFarmerBookings(farmerId);
      setFarmerBookings(res.data || []);
    } catch (err) {
      console.warn('History load error:', err.message);
      setFarmerBookings([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && selectedFarmerId) {
      loadFarmerHistory(Number(selectedFarmerId));
    }
  }, [activeTab, selectedFarmerId]);

  const selectedSlot = slots.find((s) => s.Slot_ID === Number(selectedSlotId));

  return (
    <div className="space-y-8">
      {/* Top Page Header Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-[2.5px] border-navy-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint-foam border-[1.5px] border-navy-border text-xs font-mono font-bold text-forest mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
            <span>APMC LOT DISPATCH PORTAL</span>
          </div>
          <h1 className="text-3xl font-display font-black text-navy-border tracking-tight">
            Farmer Slot Reservation
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Reserve guaranteed Mandi arrival windows with concurrency-safe gate token allocation.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 bg-mint-foam p-1.5 rounded-2xl border-[2px] border-navy-border shadow-bento-sm self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('book')}
            className={`px-4 py-2 rounded-xl text-xs font-display font-black uppercase tracking-wider transition-all ${
              activeTab === 'book'
                ? 'bg-forest text-white shadow-bento-sm'
                : 'text-navy-border hover:bg-white'
            }`}
          >
            Reserve Slot
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-display font-black uppercase tracking-wider transition-all ${
              activeTab === 'history'
                ? 'bg-forest text-white shadow-bento-sm'
                : 'text-navy-border hover:bg-white'
            }`}
          >
            My Passes
          </button>
        </div>
      </div>

      {/* Notifications */}
      {user && (
        <div className="p-3.5 px-4 rounded-2xl bg-white border-[2px] border-navy-border shadow-bento-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest text-saffron flex items-center justify-center font-bold text-xs border border-navy-border shrink-0 shadow-sm">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'AG'}
            </div>
            <div>
              <div className="text-xs font-bold text-navy-border flex items-center gap-2">
                <span>Signed In: <strong>{user.name}</strong></span>
                {user.provider === 'google' && (
                  <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9.5px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Google Verified
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                {user.email || user.phone || 'Authorized APMC Producer'} • {user.village ? `${user.village}, ${user.district || 'Surat'}` : 'Surat District'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-mono font-bold text-forest bg-mint-foam px-2.5 py-1 rounded-lg border border-navy-border">
              Fast Clearance Active
            </span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-coral/60 border-[2px] border-navy-border text-coral-dark text-xs font-mono font-bold flex items-center justify-between shadow-bento-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="font-bold text-sm">
            &times;
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-mint-light border-[2px] border-navy-border text-forest text-xs font-mono font-bold flex items-center justify-between shadow-bento-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="font-bold text-sm">
            &times;
          </button>
        </div>
      )}

      {/* TAB 1: BOOK A SLOT */}
      {activeTab === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Booking Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleCreateBooking} className="space-y-6">
              {/* Step 1: Farmer Selection */}
              <div className="bg-white p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
                  <div className="flex items-center gap-2 text-navy-border font-display font-extrabold text-sm uppercase">
                    <User className="w-4 h-4 text-forest" />
                    <span>Step 1: Producer Identification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!user && (
                      <button
                        type="button"
                        onClick={openLogin}
                        className="px-3 py-1 bg-saffron hover:bg-saffron-dark text-navy-border border border-navy-border rounded-xl font-mono text-xs font-bold shadow-bento-sm active:translate-y-0.5 transition-all"
                      >
                        Sign In / Google
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowRegisterModal(true)}
                      className="px-3 py-1 bg-mint-foam hover:bg-mint-light text-forest border border-navy-border rounded-xl font-mono text-xs font-bold shadow-bento-sm active:translate-y-0.5 transition-all flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>New Producer</span>
                    </button>
                  </div>
                </div>

                {user && (
                  <div className="p-3 bg-mint-light rounded-xl border border-navy-border flex items-center justify-between font-mono text-xs text-forest">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
                      <span>Verified Account: <strong className="text-navy-border">{user.name}</strong></span>
                    </div>
                    <span className="font-bold text-[11px] bg-white px-2 py-0.5 rounded border border-navy-border">
                      {user.village ? `${user.village}, ${user.district || 'Gujarat'}` : user.role || 'Farmer'}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block font-mono text-xs font-bold text-slate-600 mb-1.5 uppercase">
                    Select Registered Producer
                  </label>
                  <select
                    value={selectedFarmerId}
                    onChange={(e) => setSelectedFarmerId(Number(e.target.value))}
                    className="w-full h-12 px-3.5 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-mono text-xs sm:text-sm font-bold text-navy-border focus:ring-0 focus:border-forest shadow-bento-sm"
                  >
                    {farmers.map((f) => (
                      <option key={f.Farmer_ID} value={f.Farmer_ID}>
                        {f.Full_Name} ({f.District}, {f.Village}) • Phone: {f.Phone_Number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Mandi Selection & Slot Grid */}
              <div className="bg-white p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
                  <div className="flex items-center gap-2 text-navy-border font-display font-extrabold text-sm uppercase">
                    <MapPin className="w-4 h-4 text-forest" />
                    <span>Step 2: Destination APMC Yard</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-forest">Live Daily Limit</span>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-slate-600 mb-1.5 uppercase">
                    Select Target Mandi
                  </label>
                  <select
                    value={selectedMandiId}
                    onChange={(e) => setSelectedMandiId(Number(e.target.value))}
                    className="w-full h-12 px-3.5 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-mono text-xs sm:text-sm font-bold text-navy-border focus:ring-0 focus:border-forest shadow-bento-sm"
                  >
                    {mandis.map((m) => (
                      <option key={m.Mandi_ID} value={m.Mandi_ID}>
                        {m.Mandi_Name} ({m.District}) • Cap: {m.Daily_Capacity_Tons || 250}T
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available Slots Grid */}
                <div className="pt-2">
                  <label className="block font-mono text-xs font-bold text-slate-600 mb-2 uppercase flex items-center justify-between">
                    <span>Available Slot Arrival Windows</span>
                    {loadingSlots && <span className="text-forest text-xs font-bold">Updating...</span>}
                  </label>

                  {slots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-canvas border-[1.5px] border-navy-border text-center font-mono text-xs font-semibold text-slate-500">
                      No active slots configured for this Mandi.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {slots.map((slot) => {
                        const isFull = slot.Remaining_Capacity_Tons <= 0;
                        const isSelected = selectedSlotId === slot.Slot_ID;
                        const percentFilled = Math.min(
                          100,
                          Math.round(
                            ((slot.Max_Capacity_Tons - slot.Remaining_Capacity_Tons) /
                              slot.Max_Capacity_Tons) *
                              100
                          )
                        );

                        return (
                          <div
                            key={slot.Slot_ID}
                            onClick={() => !isFull && setSelectedSlotId(slot.Slot_ID)}
                            className={`p-3.5 rounded-2xl border-[2px] transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-saffron/20 border-navy-border shadow-bento-sm'
                                : isFull
                                ? 'bg-canvas border-slate-300 opacity-60 cursor-not-allowed'
                                : 'bg-white border-navy-border hover:bg-mint-light/30 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-xs font-black text-navy-border flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{new Date(slot.Slot_Date).toLocaleDateString()}</span>
                              </span>
                              <span
                                className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  isFull
                                    ? 'bg-coral text-coral-dark border-navy-border'
                                    : percentFilled > 75
                                    ? 'bg-saffron text-navy-border border-navy-border'
                                    : 'bg-mint-foam text-forest border-navy-border'
                                }`}
                              >
                                {isFull ? 'Full' : `${slot.Remaining_Capacity_Tons}T Left`}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 font-mono text-xs text-forest-light font-bold mb-2">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {slot.Start_Time.slice(0, 5)} - {slot.End_Time.slice(0, 5)}
                              </span>
                            </div>

                            <div className="w-full bg-canvas h-2 rounded-full border border-navy-border overflow-hidden p-0.5">
                              <div
                                className={`h-full rounded-full ${
                                  isFull ? 'bg-coral-dark' : percentFilled > 75 ? 'bg-saffron' : 'bg-forest'
                                }`}
                                style={{ width: `${percentFilled}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Produce & Weight */}
              <div className="bg-white p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100 text-navy-border font-display font-extrabold text-sm uppercase">
                  <Wheat className="w-4 h-4 text-forest" />
                  <span>Step 3: Produce &amp; Lot Quantity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs font-bold text-slate-600 mb-1.5 uppercase">
                      Commodity
                    </label>
                    <select
                      value={selectedProduceId}
                      onChange={(e) => setSelectedProduceId(Number(e.target.value))}
                      className="w-full h-12 px-3.5 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-mono text-xs font-bold text-navy-border focus:ring-0 focus:border-forest shadow-bento-sm"
                    >
                      {produceList.map((p) => (
                        <option key={p.Produce_ID} value={p.Produce_ID}>
                          {p.Produce_Name} ({p.Category}) • Base ₹{p.Base_Price_Per_Ton}/T
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-xs font-bold text-slate-600 mb-1.5 uppercase">
                      Declared Weight (Metric Tons)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="e.g. 4.5"
                      value={estimatedWeight}
                      onChange={(e) => setEstimatedWeight(e.target.value ? Number(e.target.value) : '')}
                      className="w-full h-12 px-3.5 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-mono text-sm font-bold text-navy-border focus:ring-0 focus:border-forest shadow-bento-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Confirm Booking CTA */}
              <button
                type="submit"
                disabled={loading || !selectedSlotId || slots.length === 0}
                className="w-full py-4 rounded-xl bg-forest hover:bg-forest-light disabled:bg-slate-300 disabled:text-slate-500 text-white font-display font-black text-sm uppercase tracking-wider border-[2px] border-navy-border shadow-bento hover:shadow-bento-hover active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-saffron" />
                    <span>Allocating Slot...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5 text-saffron" />
                    <span>Confirm Booking &amp; Issue Gate-Pass Slip</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Summary Sidebar (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
                <h3 className="font-display font-black text-base text-navy-border uppercase">
                  Reservation Ticket Summary
                </h3>
                <span className="px-2 py-0.5 bg-saffron text-navy-border font-mono text-[10px] font-black rounded border border-navy-border">
                  VERIFIED
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs text-slate-600">
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400 uppercase font-bold">Mandi Yard:</span>
                  <span className="font-bold text-navy-border">
                    {mandis.find((m) => m.Mandi_ID === Number(selectedMandiId))?.Mandi_Name || 'None'}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400 uppercase font-bold">Date Window:</span>
                  <span className="font-bold text-navy-border">
                    {selectedSlot ? new Date(selectedSlot.Slot_Date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400 uppercase font-bold">Arrival Time:</span>
                  <span className="font-bold text-forest">
                    {selectedSlot ? `${selectedSlot.Start_Time.slice(0, 5)} - ${selectedSlot.End_Time.slice(0, 5)}` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400 uppercase font-bold">Remaining Cap:</span>
                  <span className="font-bold text-navy-border">
                    {selectedSlot ? `${selectedSlot.Remaining_Capacity_Tons} Tons` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400 uppercase font-bold">Declared Weight:</span>
                  <span className="font-bold text-navy-border">
                    {estimatedWeight ? `${estimatedWeight} MT (${Number(estimatedWeight) * 1000} KG)` : '0.0 MT'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-mint-light rounded-xl border-[1.5px] border-navy-border text-xs font-mono text-forest space-y-1">
                <div className="font-black flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>TRANSACTION CONCURRENCY SAFE</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Slot capacity is decremented atomically with row locks. No overbooking is mathematically possible.
                </p>
              </div>
            </div>

            {/* Quick Check Existing Pass Card */}
            <div className="bg-mint-foam p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-3">
              <span className="font-mono text-[10px] font-black text-forest uppercase tracking-wider block">
                EXISTING PASS LOOKUP
              </span>
              <h4 className="font-display font-black text-lg text-navy-border">Have a Token Already?</h4>
              <p className="text-xs text-slate-600 font-medium">
                You can reprint, verify, or cancel your existing pass ticket from the My Passes tab.
              </p>
              <button
                onClick={() => setActiveTab('history')}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border-[1.5px] border-navy-border text-navy-border font-mono text-xs font-bold shadow-bento-sm active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Look Up My Bookings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY BOOKINGS & PASS LOOKUP */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Gate-Pass Token (e.g. AG-T001) or numeric Farmer ID (e.g. 1)..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchHistory()}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-mint-light/40 border-[2px] border-navy-border font-mono text-xs sm:text-sm font-bold text-navy-border placeholder-slate-400 focus:ring-0 focus:border-forest"
              />
            </div>
            <button
              onClick={handleSearchHistory}
              disabled={loadingHistory}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm active:translate-y-0.5 flex items-center justify-center gap-1.5"
            >
              {loadingHistory ? (
                <span>Searching...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Search Pass</span>
                </>
              )}
            </button>
          </div>

          {/* Bookings Table / List */}
          <div className="bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-slate-100 flex items-center justify-between">
              <h3 className="font-display font-black text-base text-navy-border uppercase">
                Active Booking Records
              </h3>
              <span className="font-mono text-xs font-bold text-slate-400">
                {farmerBookings.length} passes found
              </span>
            </div>

            {farmerBookings.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs font-semibold text-slate-500">
                No active bookings found. Try searching by your Gate-Pass Token (e.g. AG-T10001) or book a new slot above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-canvas text-slate-500 uppercase font-black border-b border-navy-border">
                    <tr>
                      <th className="px-6 py-3">Token Slip</th>
                      <th className="px-6 py-3">Mandi Yard</th>
                      <th className="px-6 py-3">Arrival Window</th>
                      <th className="px-6 py-3">Commodity</th>
                      <th className="px-6 py-3">Weight</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-navy-border">
                    {farmerBookings.map((b) => {
                      const st = String(b.Booking_Status || '').toUpperCase();
                      const isConfirmed = st === 'CONFIRMED';
                      const isCheckedIn = st.includes('CHECK');
                      const isCompleted = st === 'COMPLETED';
                      const tokenDisplay = b.Token_Number || b.Gate_Pass_Token || `AG-T${b.Booking_ID}`;

                      return (
                        <tr key={b.Booking_ID} className="hover:bg-mint-light/20 transition-colors">
                          <td className="px-6 py-4 font-black text-forest">{tokenDisplay}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-navy-border">{b.Mandi_Name}</div>
                            <div className="text-[11px] text-slate-400">{b.District}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div>{b.Slot_Date ? new Date(b.Slot_Date).toLocaleDateString() : 'Today'}</div>
                            <div className="text-[11px] text-forest font-bold">
                              {b.Start_Time?.slice(0, 5)} - {b.End_Time?.slice(0, 5)}
                            </div>
                          </td>
                          <td className="px-6 py-4">{b.Produce_Name}</td>
                          <td className="px-6 py-4 font-bold">{b.Estimated_Weight_Tons} MT</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                                isConfirmed
                                  ? 'bg-mint-foam text-forest border-navy-border'
                                  : isCheckedIn
                                  ? 'bg-periwinkle text-indigo-900 border-navy-border'
                                  : isCompleted
                                  ? 'bg-lilac text-lilac-dark border-navy-border'
                                  : 'bg-coral text-coral-dark border-navy-border'
                              }`}
                            >
                              {b.Booking_Status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => setActivePassBooking(b)}
                              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border-[1.5px] border-navy-border text-navy-border font-bold text-xs shadow-bento-sm active:translate-y-0.5"
                            >
                              Slip
                            </button>
                            <button
                              onClick={() => setSmsModalBooking(b)}
                              className="px-2.5 py-1 rounded-lg bg-mint-foam hover:bg-mint-light border-[1.5px] border-navy-border text-forest font-bold text-xs shadow-bento-sm active:translate-y-0.5"
                            >
                              SMS
                            </button>
                            {isConfirmed && (
                              <button
                                onClick={() => handleCancelBooking(b.Booking_ID)}
                                className="px-2.5 py-1 rounded-lg bg-coral hover:bg-coral-dark hover:text-white border-[1.5px] border-navy-border text-coral-dark font-bold text-xs shadow-bento-sm active:translate-y-0.5"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: NEW FARMER REGISTRATION */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
              <h3 className="font-display font-black text-base text-navy-border uppercase">
                Register Producer
              </h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-navy-border font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRegisterFarmer} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={newFarmer.Full_Name}
                  onChange={(e) => setNewFarmer({ ...newFarmer, Full_Name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-mint-light/40 border-[2px] border-navy-border text-navy-border font-bold focus:ring-0 focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="10 digits"
                    value={newFarmer.Phone_Number}
                    onChange={(e) => setNewFarmer({ ...newFarmer, Phone_Number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-mint-light/40 border-[2px] border-navy-border text-navy-border font-bold focus:ring-0 focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase">Aadhaar (12 digits)</label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{12}"
                    placeholder="12 digits"
                    value={newFarmer.Aadhaar_Number}
                    onChange={(e) => setNewFarmer({ ...newFarmer, Aadhaar_Number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-mint-light/40 border-[2px] border-navy-border text-navy-border font-bold focus:ring-0 focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1 uppercase">UPI ID (Payouts)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ramesh@upi"
                  value={newFarmer.UPI_ID}
                  onChange={(e) => setNewFarmer({ ...newFarmer, UPI_ID: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-mint-light/40 border-[2px] border-navy-border text-navy-border font-bold focus:ring-0 focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase">Village</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bardoli"
                    value={newFarmer.Village}
                    onChange={(e) => setNewFarmer({ ...newFarmer, Village: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-mint-light/40 border-[2px] border-navy-border text-navy-border font-bold focus:ring-0 focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1 uppercase">District</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surat"
                    value={newFarmer.District}
                    onChange={(e) => setNewFarmer({ ...newFarmer, District: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-mint-light/40 border-[2px] border-navy-border text-navy-border font-bold focus:ring-0 focus:border-forest"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl bg-canvas border-[1.5px] border-navy-border font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm"
                >
                  {loading ? 'Saving...' : 'Save Producer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP: ACTIVE GATE PASS MODAL */}
      {activePassBooking && (
        <GatePassModal
          booking={activePassBooking}
          onClose={() => setActivePassBooking(null)}
          onOpenSms={() => {
            setSmsModalBooking(activePassBooking);
          }}
        />
      )}

      {/* POPUP: SIMULATED SMS / WHATSAPP NOTIFICATION MODAL */}
      {smsModalBooking && (
        <SmsNotificationModal
          booking={smsModalBooking}
          onClose={() => setSmsModalBooking(null)}
          onOpenGatePass={() => {
            setActivePassBooking(smsModalBooking);
          }}
        />
      )}
    </div>
  );
}

export default function FarmerPortalPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 font-mono text-slate-500">Loading slot reservation portal...</div>}>
      <FarmerPortalContent />
    </Suspense>
  );
}
