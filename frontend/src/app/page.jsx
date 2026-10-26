'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Scale, 
  QrCode, 
  Camera, 
  Zap, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Warehouse, 
  Printer, 
  Flag, 
  Check, 
  Search,
  Droplets,
  Layers,
  ArrowRight,
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  Tractor,
  Clock,
  Activity,
  MessageSquare
} from 'lucide-react';
import { AgriSlotAPI } from '@/lib/api';
import GatePassModal from '@/components/GatePassModal';
import SmsNotificationModal from '@/components/SmsNotificationModal';
import { useLanguage } from '@/context/LanguageContext';

export default function HomePage() {
  const { t } = useLanguage();
  const [tokenInput, setTokenInput] = useState('AG-T001');
  const [activeBooking, setActiveBooking] = useState(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [queueBookings, setQueueBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);

  // Selected Bay
  const [selectedBay, setSelectedBay] = useState('BAY 04 — BULK ONION DOCK (ACTIVE)');
  const [autoSyncLedger, setAutoSyncLedger] = useState(true);
  const [printRfid, setPrintRfid] = useState(true);
  const [checkInAlert, setCheckInAlert] = useState('');

  // Fetch initial data
  useEffect(() => {
    async function loadInitialData() {
      try {
        const statsRes = await AgriSlotAPI.getStatistics().catch(() => null);
        if (statsRes?.data) {
          setStats(statsRes.data);
        }

        // Try seeded token first (AG-T001), fallback to demo token (AG-T10001)
        let bookingRes = await AgriSlotAPI.getBookingByToken('AG-T001').catch(() => null);
        if (!bookingRes?.data) {
          bookingRes = await AgriSlotAPI.getBookingByToken('AG-T10001').catch(() => null);
        }
        if (bookingRes?.data) {
          setActiveBooking(bookingRes.data);
          setTokenInput(bookingRes.data.Token_Number || bookingRes.data.Gate_Pass_Token || 'AG-T001');
        }
      } catch (err) {
        console.warn('Initial load error:', err);
      }
    }
    loadInitialData();
  }, []);

  // Pull ledger record by token
  const handlePullLedger = async (t) => {
    const searchToken = (t || tokenInput).trim();
    if (!searchToken) {
      setTokenError('Please enter a gate-pass token code');
      return;
    }

    try {
      setLoadingToken(true);
      setTokenError('');
      const res = await AgriSlotAPI.getBookingByToken(searchToken);
      if (res.data) {
        setActiveBooking(res.data);
      } else {
        setTokenError(`No record found for token ${searchToken}`);
      }
    } catch (err) {
      setTokenError(err.message || 'Token verification failed');
    } finally {
      setLoadingToken(false);
    }
  };

  // Quick Queue preset clicker
  const handleQueueClick = (tkn) => {
    setTokenInput(tkn);
    handlePullLedger(tkn);
  };

  // Approve & Check-In
  const handleApproveCheckIn = () => {
    if (!activeBooking) {
      alert('Please pull a ledger record first using token code.');
      return;
    }
    const token = activeBooking.Token_Number || activeBooking.Gate_Pass_Token || tokenInput;
    setCheckInAlert(`GATEPASS #${token} ISSUED: Vehicle Cleared for ${selectedBay.split('—')[0].trim()}.`);
    setTimeout(() => setCheckInAlert(''), 5000);
  };

  const declaredWeight = activeBooking ? Number(activeBooking.Estimated_Weight_Tons) : 4.5;
  const netKg = Math.round(declaredWeight * 1000);
  const tareKg = 2920;
  const grossKg = netKg + tareKg;

  return (
    <div className="flex flex-col gap-8">
      {/* SECTION 1: Editorial Header + Bento Hero Ticket Scanner */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Editorial Intro (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-bento border-[2.5px] border-navy-border shadow-bento flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-mint-foam -z-0 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-light border-[1.5px] border-navy-border text-xs font-mono font-bold text-saffron-dark mb-3">
              <Truck className="w-3.5 h-3.5" />
              <span>{t('heroBadge')}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-navy-border tracking-tight leading-[1.15]">
              {t('heroTitlePart1')} <br />
              <span className="text-forest underline decoration-saffron decoration-wavy decoration-2">
                {t('heroTitlePart2')}
              </span>
            </h1>
            <p className="text-slate-600 text-sm mt-3 leading-relaxed font-medium">
              {t('heroSubtitle')}
            </p>
          </div>

          {/* Dynamic Status Badges */}
          <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
            <div className="p-3 bg-mint-light rounded-2xl border-[1.5px] border-navy-border">
              <div className="font-mono text-[10px] uppercase font-bold text-forest-light">{t('scaleStatusLabel')}</div>
              <div className="text-xs font-bold text-forest flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
                <span>{t('scaleStatusVal')}</span>
              </div>
            </div>
            <div className="p-3 bg-periwinkle/50 rounded-2xl border-[1.5px] border-navy-border">
              <div className="font-mono text-[10px] uppercase font-bold text-indigo-700">{t('recommendedBayLabel')}</div>
              <div className="text-xs font-bold text-navy-border mt-0.5">{t('recommendedBayVal')}</div>
            </div>
          </div>
        </div>

        {/* Right Perforated Ticket Style Scanner Widget (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento flex flex-col sm:flex-row relative overflow-hidden">
          {/* Left Ticket Stub Segment */}
          <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between bg-white relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-forest bg-mint-foam px-2.5 py-1 rounded-full border border-navy-border">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>INBOUND PASS SCAN</span>
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-400">SERIES 2026-X</span>
              </div>

              <label className="block font-display font-bold text-base text-navy-border mb-1.5">
                Scan Token or Enter Farmer Mandi ID
              </label>

              {/* Neo-Input Field */}
              <div className="relative flex items-center mt-2">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handlePullLedger()}
                  placeholder="e.g. AG-T10001"
                  className="w-full h-12 py-3 pl-4 pr-10 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-mono text-sm font-bold text-navy-border focus:ring-0 focus:border-forest focus:bg-white shadow-[2px_2px_0_#0F2B20] transition-all"
                />
                {tokenInput && (
                  <button
                    onClick={() => setTokenInput('')}
                    className="absolute right-3 text-slate-400 hover:text-navy-border"
                  >
                    &times;
                  </button>
                )}
              </div>

              {tokenError && (
                <div className="mt-2 text-xs font-mono font-bold text-coral-dark flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{tokenError}</span>
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <Link
                href="/verify"
                className="px-5 py-3 rounded-xl bg-saffron hover:bg-saffron-dark text-navy-border font-display font-extrabold text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento-hover active:translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Scan Ticket</span>
              </Link>
              <button
                onClick={() => handlePullLedger()}
                disabled={loadingToken}
                className="px-5 py-3 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-extrabold text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento-hover active:translate-y-0.5 transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-saffron" />
                <span>{loadingToken ? 'Pulling...' : 'Pull Ledger Record'}</span>
              </button>
            </div>
          </div>

          {/* Perforated Tear-off Side Badge */}
          <div className="sm:w-36 bg-mint-foam border-t-[2.5px] sm:border-t-0 sm:border-l-[2.5px] border-dashed border-navy-border p-5 flex sm:flex-col items-center justify-between text-center relative">
            {/* Cutout Circles Decorative Emulation */}
            <div className="hidden sm:block absolute -top-3 left-[-11px] w-5 h-5 rounded-full bg-canvas border-[2.5px] border-navy-border"></div>
            <div className="hidden sm:block absolute -bottom-3 left-[-11px] w-5 h-5 rounded-full bg-canvas border-[2.5px] border-navy-border"></div>

            <span className="font-mono text-[10px] font-bold text-forest-light uppercase tracking-widest sm:[writing-mode:vertical-rl] sm:rotate-180">
              BOARDING PASS TICKET
            </span>

            <div className="w-14 h-14 bg-white p-1 rounded-xl border-[1.5px] border-navy-border shadow-sm flex items-center justify-center my-2">
              <QrCode className="w-10 h-10 text-forest" />
            </div>

            <span className="font-mono text-[11px] font-bold text-navy-border">
              {activeBooking ? `#BK-${activeBooking.Booking_ID}` : 'SLIP #88439'}
            </span>
          </div>
        </div>
      </section>

      {/* Check-in Success Banner if triggered */}
      {checkInAlert && (
        <div className="p-4 rounded-2xl bg-mint-light border-[2px] border-forest text-forest font-mono text-xs font-bold shadow-bento-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-forest" />
            <span>{checkInAlert}</span>
          </div>
          <button onClick={() => setCheckInAlert('')} className="font-bold text-sm">
            &times;
          </button>
        </div>
      )}

      {/* SECTION 2: Master Interactive Bento Cards (Profile/ANPR + Giant Readout Deck) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT BENTO: Farmer Profile + Polaroid ANPR Camera (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Farmer & Vehicle Manifest */}
          <div className="bg-white p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento relative">
            <div className="flex items-center justify-between pb-4 border-b-[2px] border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-sm uppercase text-navy-border">
                  Farmer Dossier
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-mint-light border border-forest-light text-forest font-mono text-[10px] font-bold">
                  e-NAM VERIFIED
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-saffron-light border border-saffron-dark text-saffron-dark font-mono text-[10px] font-bold">
                  CLEAR
                </span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-4 mt-5">
              <div className="w-16 h-16 rounded-2xl border-[2px] border-navy-border overflow-hidden shadow-bento-sm bg-mint-foam shrink-0">
                <img
                  className="w-full h-full object-cover"
                  alt="Farmer Portrait"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBog2VtENKUbH-j96h13e_7Uwome_Kl1T6ju4zZ5Q5uLfFOBIgPI2VPEEX4SmrzTMr22deDi7yDfJC0hhweBDCw5ldoAVf-sEjUYIjfl5OW-yl6-bFH5XRILk-jTxo74V2IObAP103-pT3o-LeDE3VHmwXLKQ3GC6Ejb8djPdfjseVOziQHZDK2Kbqab7hsyBor8VlHhMuK5TaXfCLxCsr-iPRdro-tVdJ95FuecZ90PHy4AZxxDZc"
                />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-navy-border leading-tight">
                  {activeBooking?.Farmer_Name || 'Suresh Ramrao Patil'}
                </h3>
                <p className="font-mono text-xs font-semibold text-slate-500 mt-0.5">
                  UID: {activeBooking ? `FMR-${activeBooking.Farmer_ID}-APMC` : 'NSK-MH-2024-91'}
                </p>
                <div className="inline-flex items-center gap-1 text-[11px] font-bold text-forest bg-mint-foam px-2 py-0.5 rounded-md mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {activeBooking?.Village || 'Niphad'}, {activeBooking?.District || 'Surat District'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle License Plate (Tactile Pill Format) */}
            <div className="mt-5 p-3.5 bg-mint-foam/60 rounded-2xl border-[2px] border-navy-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="px-2.5 py-1 bg-saffron rounded-lg border-[1.5px] border-navy-border font-mono font-black text-xs text-navy-border">
                  IND
                </div>
                <div className="font-mono font-black text-lg tracking-wider text-navy-border">
                  GJ-05-EG-4412
                </div>
              </div>
              <span className="font-mono text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-navy-border text-slate-600">
                BOLERO MAXI
              </span>
            </div>

            {/* Commodity Details Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="p-2.5 bg-canvas rounded-xl border-[1.5px] border-navy-border">
                <span className="font-mono text-[9.5px] uppercase font-bold text-slate-400 block">Commodity</span>
                <span className="font-display font-extrabold text-xs text-navy-border truncate block">
                  {activeBooking?.Produce_Name || 'Red Onion'}
                </span>
              </div>
              <div className="p-2.5 bg-canvas rounded-xl border-[1.5px] border-navy-border">
                <span className="font-mono text-[9.5px] uppercase font-bold text-slate-400 block">Category</span>
                <span className="font-display font-extrabold text-xs text-navy-border truncate block">
                  {activeBooking?.Category || 'Kharif'}
                </span>
              </div>
              <div className="p-2.5 bg-canvas rounded-xl border-[1.5px] border-navy-border">
                <span className="font-mono text-[9.5px] uppercase font-bold text-slate-400 block">Declared Lot</span>
                <span className="font-display font-extrabold text-xs text-navy-border block">
                  {declaredWeight} Tons
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Instant-Camera Polaroid Styled ANPR Snapshot */}
          <div className="bg-white p-4 pt-5 pb-5 rounded-bento border-[2.5px] border-navy-border shadow-bento relative">
            <div className="polaroid-tape"></div>
            <div className="rounded-xl overflow-hidden border-[2px] border-navy-border relative bg-navy-border">
              <img
                className="w-full h-44 object-cover filter contrast-110"
                alt="ANPR camera snapshot on weigh deck"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsPhmWazqvN1bb8GIgl4JW_O9HLyci3w5HtGV6euWNQfZxlAaH9G5ZMMhUkjq-0gRFgJtl8KcY33xJ3K4phGfsaYPXZ9fKiDzAmXpev0jW8Yc8BG9d7x3FrlWCZTKGDkHcFTSuYKiuT1yRIioayCyvb4FT0_4Oj1oz9f0yXdB-vpZMYdm309zDTuzC0eXANx5InwEsyamzlNIqJLufamt9yENmtVF92D7HLmQdppBvLUlJW5t_Pu0"
              />

              {/* Polaroid Overlay Camera Stamps */}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-coral border border-navy-border text-coral-dark font-mono text-[10px] font-black flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-coral-dark pulse-dot"></span>
                <span>ANPR CAM #02</span>
              </div>

              {/* Plate Recognition Stamp */}
              <div className="absolute bottom-2.5 inset-x-2.5 bg-white/95 backdrop-blur-sm p-2 rounded-lg border-[1.5px] border-navy-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest" />
                  <div className="font-mono text-[11px] font-black text-navy-border">
                    OCR: GJ-05-EG-4412
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-mint-light text-forest font-mono text-[9.5px] font-black border border-forest-light">
                  99.4% CONFIDENCE
                </span>
              </div>
            </div>

            {/* Polaroid Bottom Caption with Timestamp Stamp */}
            <div className="mt-3.5 flex items-center justify-between px-1">
              <div className="font-mono text-xs text-slate-500 font-bold">
                LATENCY: 14ms • 1080P/60FPS
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-saffron-light border border-saffron-dark text-saffron-dark font-mono text-[10px] font-bold stamp-rotate-right">
                STAMP: LIVE IST
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT BENTO: Giant Typography Weighbridge + Quality + Bay Allocation (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-bento border-[2.5px] border-navy-border shadow-bento relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-forest text-saffron flex items-center justify-center border border-navy-border">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-navy-border">Real-Time Load Cells</h3>
                  <p className="font-mono text-[10px] text-slate-400 font-bold">
                    STATION PLATFORM #02 // HIGH ACCURACY
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-mint-foam rounded-full border border-forest font-mono text-xs font-bold text-forest">
                <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
                <span>ACTIVE SENSORS</span>
              </div>
            </div>

            {/* Giant Net Weight Highlight Bento Box */}
            <div className="p-6 bg-gradient-to-br from-mint-light via-mint-foam to-emerald-100 rounded-bento border-[2.5px] border-navy-border shadow-bento-sm relative overflow-hidden">
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-white border-[1.5px] border-forest text-forest rounded-full font-mono text-[10px] font-black stamp-rotate shadow-stamp">
                  ✓ e-NAM AUTHENTICATED
                </span>
                <span className="px-2.5 py-1 bg-saffron border-[1.5px] border-navy-border text-navy-border rounded-full font-mono text-[10px] font-black stamp-rotate-right shadow-stamp">
                  0.0% VARIANCE
                </span>
              </div>

              <span className="font-mono text-xs font-bold uppercase tracking-wider text-forest-light block">
                Calculated Net Produce Payload
              </span>

              {/* Giant Expressive Typography */}
              <div className="flex items-baseline gap-3 my-2">
                <span className="font-display font-black text-5xl sm:text-6xl md:text-7xl text-navy-border tracking-tight">
                  {netKg.toLocaleString()}
                </span>
                <span className="font-display font-extrabold text-2xl text-forest">
                  KG <span className="text-sm font-mono font-bold text-slate-500">({declaredWeight.toFixed(2)} MT)</span>
                </span>
              </div>

              {/* Visual Sub-Bar Progress */}
              <div className="pt-4 mt-2 border-t border-forest/20 flex flex-wrap items-center justify-between text-xs font-mono font-bold text-forest">
                <span>DECLARED PRODUCE: {netKg.toLocaleString()} KG</span>
                <span className="bg-forest text-white px-2 py-0.5 rounded-md text-[11px]">100% SCALE MATCH</span>
              </div>
            </div>

            {/* Two Sub Metric Pills (Gross vs Tare) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-canvas rounded-2xl border-[2px] border-navy-border shadow-bento-sm">
                <div className="flex items-center justify-between text-slate-500 font-mono text-xs font-bold mb-1">
                  <span>Gross Scale Weight</span>
                  <Scale className="w-4 h-4" />
                </div>
                <div className="font-display font-black text-3xl text-navy-border">
                  {grossKg.toLocaleString()} <span className="text-sm font-mono font-bold text-slate-500">KG</span>
                </div>
                <div className="mt-2 text-[11px] font-mono font-bold text-forest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> LOAD CELLS LOCKED
                </div>
              </div>

              <div className="p-4 bg-canvas rounded-2xl border-[2px] border-navy-border shadow-bento-sm">
                <div className="flex items-center justify-between text-slate-500 font-mono text-xs font-bold mb-1">
                  <span>Registered Tare Deduction</span>
                  <Truck className="w-4 h-4" />
                </div>
                <div className="font-display font-black text-3xl text-navy-border">
                  {tareKg.toLocaleString()} <span className="text-sm font-mono font-bold text-slate-500">KG</span>
                </div>
                <div className="mt-2 text-[11px] font-mono font-bold text-slate-500">
                  RC DB VALUE VERIFIED
                </div>
              </div>
            </div>

            {/* Moisture Gauge + Quality Bento Strip */}
            <div className="mt-5 p-4 bg-saffron-light/60 rounded-2xl border-[2px] border-navy-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="w-11 h-11 rounded-xl bg-saffron text-navy-border border-[1.5px] border-navy-border flex items-center justify-center font-bold shrink-0 shadow-bento-sm">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-extrabold text-sm text-navy-border">Ultrasonic Moisture Gauge</span>
                    <span className="px-2 py-0.5 rounded-full bg-white border border-navy-border text-navy-border font-mono text-[9px] font-black">
                      GRADE A OPTIMAL
                    </span>
                  </div>
                  <div className="font-display font-black text-xl text-navy-border">
                    11.8% <span className="font-mono text-xs font-semibold text-slate-500">(Threshold &lt; 14.0%)</span>
                  </div>
                </div>
              </div>

              {/* Progress Visual Bar */}
              <div className="w-full sm:w-44">
                <div className="flex justify-between font-mono text-[10px] font-bold text-slate-500 mb-1">
                  <span>SCALE GAUGE</span>
                  <span>11.8 / 25%</span>
                </div>
                <div className="h-3 w-full bg-white rounded-full border-[1.5px] border-navy-border overflow-hidden p-0.5">
                  <div className="h-full bg-saffron rounded-full border border-navy-border" style={{ width: '47.2%' }}></div>
                </div>
              </div>
            </div>

            {/* Bay Slotting Selector */}
            <div className="mt-5 p-4 bg-periwinkle/30 rounded-2xl border-[2px] border-navy-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block font-display font-bold text-xs uppercase text-navy-border mb-1 flex items-center gap-1.5">
                  <Warehouse className="w-4 h-4 text-forest" />
                  <span>Target Unloading Ramp / Bay Assignment</span>
                </label>
                <div className="font-mono text-xs font-semibold text-slate-500">Discharge Turnaround: ~18 Mins</div>
              </div>
              <div className="sm:w-72">
                <select
                  value={selectedBay}
                  onChange={(e) => setSelectedBay(e.target.value)}
                  className="w-full h-11 bg-white border-[2px] border-navy-border rounded-xl px-3 font-mono text-xs font-bold text-navy-border focus:ring-0 focus:border-forest shadow-bento-sm"
                >
                  <option value="BAY 01 — EXPEDITE EXPORT CORRIDOR">BAY 01 — EXPEDITE EXPORT CORRIDOR</option>
                  <option value="BAY 02 — VENTILATED TUBER RAMP">BAY 02 — VENTILATED TUBER RAMP</option>
                  <option value="BAY 03 — GRAIN SILO & CHUTE">BAY 03 — GRAIN SILO &amp; CHUTE</option>
                  <option value="BAY 04 — BULK ONION DOCK (ACTIVE)">BAY 04 — BULK ONION DOCK (ACTIVE)</option>
                  <option value="BAY 05 — BALING & FIBER STATION">BAY 05 — BALING &amp; FIBER STATION</option>
                  <option value="BAY 08 — COLD LOGISTICS VAULT">BAY 08 — COLD LOGISTICS VAULT</option>
                </select>
              </div>
            </div>

            {/* Quick Auto-Sync Toggles */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-bold text-navy-border">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncLedger}
                  onChange={(e) => setAutoSyncLedger(e.target.checked)}
                  className="w-4 h-4 rounded text-forest focus:ring-0 border-[2px] border-navy-border"
                />
                <span>Auto-Sync e-NAM Transaction Ledger</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printRfid}
                  onChange={(e) => setPrintRfid(e.target.checked)}
                  className="w-4 h-4 rounded text-forest focus:ring-0 border-[2px] border-navy-border"
                />
                <span>Print RFID Pass Tag</span>
              </label>
            </div>

            {/* Action Command Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-6 pt-5 border-t-[2px] border-slate-100">
              <button
                onClick={() => {
                  if (activeBooking) {
                    setShowGatePassModal(true);
                  } else {
                    alert('Please pull a booking token first.');
                  }
                }}
                className="sm:col-span-3 h-12 py-3 px-3 rounded-xl bg-white hover:bg-slate-50 text-navy-border font-display font-bold text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento-hover active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{t('printPassSlip')}</span>
              </button>

              <button
                onClick={() => {
                  if (activeBooking) {
                    setShowSmsModal(true);
                  } else {
                    alert('Please pull a booking token first.');
                  }
                }}
                className="sm:col-span-3 h-12 py-3 px-3 rounded-xl bg-mint-foam hover:bg-mint-light text-forest font-display font-bold text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento-hover active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>SMS Alert</span>
              </button>

              <button
                onClick={() => alert('Dispute logged with APMC Quality Inspector.')}
                className="sm:col-span-2 h-12 py-3 px-2 rounded-xl bg-coral/60 hover:bg-coral text-coral-dark font-display font-bold text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento-hover active:translate-y-0.5 transition-all flex items-center justify-center gap-1"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{t('dispute')}</span>
              </button>

              <button
                onClick={handleApproveCheckIn}
                className="sm:col-span-4 h-12 py-3 px-3 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento-hover active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 text-saffron" />
                <span>{t('approveCheckIn')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2.5: Interactive Mandi Yard Map & Unloading Bay Grid */}
      <section className="bg-white p-6 sm:p-7 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-[2px] border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint-foam border-[1.5px] border-forest text-xs font-mono font-bold text-forest mb-2">
              <Warehouse className="w-3.5 h-3.5" />
              <span>TERMINAL YARD ALLOCATION</span>
            </div>
            <h3 className="font-display font-black text-2xl text-navy-border">
              Mandi Discharge Bays &amp; Yard Map
            </h3>
            <p className="font-mono text-xs text-slate-500 font-bold mt-0.5">
              Live automated dock assignment • Click any bay to route the active inbound vehicle
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-mint-light border border-forest text-forest font-mono text-xs font-bold">
              6 / 6 BAYS ONLINE
            </span>
            <span className="px-3 py-1 rounded-full bg-saffron-light border border-saffron-dark text-saffron-dark font-mono text-xs font-bold">
              AVG DOCK TIME: 16 MIN
            </span>
          </div>
        </div>

        {/* 6-Bay Interactive Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              bayId: 'BAY-01',
              name: 'Export Corridor',
              category: 'Grade A Perishables',
              type: 'BAY 01 — EXPEDITE EXPORT CORRIDOR',
              status: 'AVAILABLE',
              statusColor: 'text-forest bg-mint-foam border-forest',
              equipment: 'Rapid Belt Conveyor',
              turnaround: '12 min',
              occupancy: 'Idle • Ready for Inbound',
              truck: null
            },
            {
              bayId: 'BAY-02',
              name: 'Ventilated Tuber Ramp',
              category: 'Potatoes & Root Veg',
              type: 'BAY 02 — VENTILATED TUBER RAMP',
              status: 'UNLOADING (65%)',
              statusColor: 'text-saffron-dark bg-saffron-light border-saffron-dark',
              equipment: 'Hydraulic Tipping Ramp',
              turnaround: '18 min',
              occupancy: 'Discharging Lot 8841',
              truck: 'Tata 407 (GJ-05-AH)'
            },
            {
              bayId: 'BAY-03',
              name: 'Grain Silo & Chute',
              category: 'Wheat & Cereals',
              type: 'BAY 03 — GRAIN SILO & CHUTE',
              status: 'OCCUPIED',
              statusColor: 'text-indigo-800 bg-periwinkle border-indigo-700',
              equipment: 'Pneumatic Grain Auger',
              turnaround: '25 min',
              occupancy: 'Silo Level: 74% Full',
              truck: 'Mahindra Supro (GJ-19)'
            },
            {
              bayId: 'BAY-04',
              name: 'Bulk Onion Dock',
              category: 'High-Volume Bulbs',
              type: 'BAY 04 — BULK ONION DOCK (ACTIVE)',
              status: 'ALLOCATED / ACTIVE',
              statusColor: 'text-forest bg-mint-light border-forest',
              equipment: 'Dual Gravity Chutes',
              turnaround: '15 min',
              occupancy: 'Ready for Current Bolero',
              truck: 'Bolero (GJ-05-EG-4412)'
            },
            {
              bayId: 'BAY-05',
              name: 'Baling & Fiber Station',
              category: 'Cotton & Oilseeds',
              type: 'BAY 05 — BALING & FIBER STATION',
              status: 'STANDBY',
              statusColor: 'text-slate-700 bg-canvas border-slate-300',
              equipment: 'Moisture Sensor Hoist',
              turnaround: '20 min',
              occupancy: 'Calibration Verified',
              truck: null
            },
            {
              bayId: 'BAY-08',
              name: 'Cold Logistics Vault',
              category: 'Apples, Floriculture',
              type: 'BAY 08 — COLD LOGISTICS VAULT',
              status: 'PRE-CHILLED (2.4°C)',
              statusColor: 'text-lilac-dark bg-lilac/50 border-lilac-dark',
              equipment: 'Thermal Dock Seal',
              turnaround: '10 min',
              occupancy: 'Temperature Controlled',
              truck: null
            }
          ].map((bay) => {
            const isSelected = selectedBay === bay.type;
            return (
              <div
                key={bay.bayId}
                onClick={() => setSelectedBay(bay.type)}
                className={`p-4 rounded-2xl border-[2px] transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-forest bg-mint-light/40 shadow-bento ring-2 ring-forest/30'
                    : 'border-navy-border bg-white hover:bg-slate-50 shadow-bento-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-navy-border text-white">
                      {bay.bayId}
                    </span>
                    <span className={`font-mono text-[9.5px] font-black px-2 py-0.5 rounded-full border ${bay.statusColor}`}>
                      {bay.status}
                    </span>
                  </div>

                  <h4 className="font-display font-black text-base text-navy-border">{bay.name}</h4>
                  <div className="font-mono text-[11px] text-slate-500 font-bold mt-0.5">{bay.category}</div>

                  <div className="mt-3 p-2 bg-canvas rounded-xl border border-navy-border/15 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-500">Equipment:</span>
                      <span className="font-mono font-semibold text-navy-border">{bay.equipment}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-500">Turnaround:</span>
                      <span className="font-mono font-bold text-forest">{bay.turnaround}</span>
                    </div>
                    {bay.truck && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200">
                        <span className="font-bold text-slate-500">Docked:</span>
                        <span className="font-mono font-black text-indigo-700">{bay.truck}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-slate-500 truncate max-w-[170px]">
                    {bay.occupancy}
                  </div>
                  <button
                    type="button"
                    className={`px-3 py-1 rounded-lg font-mono text-xs font-black border transition-all ${
                      isSelected
                        ? 'bg-forest text-saffron border-navy-border shadow-sm'
                        : 'bg-white text-navy-border border-navy-border hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ROUTED' : 'ASSIGN'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: Tactile Queue List / Boarding Pass Queue Cards */}
      <section className="bg-white p-6 sm:p-7 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-[2px] border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-forest" />
              <h3 className="font-display font-black text-lg text-navy-border">Gate 02 Physical Vehicle Queue</h3>
            </div>
            <p className="font-mono text-xs text-slate-500 font-bold mt-0.5">
              Real-time dynamic slot sequencing pipeline (Click any card to inspect)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-mint-foam border border-forest text-forest font-mono text-xs font-bold">
              QUEUE LOAD: 4 VEHICLES
            </span>
            <span className="px-3 py-1 rounded-full bg-saffron-light border border-saffron-dark text-saffron-dark font-mono text-xs font-bold">
              AVG WAIT: 3.8 MINS
            </span>
          </div>
        </div>

        {/* Boarding Pass Style Tactile Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Token Card 1: Currently Scaling */}
          <div
            onClick={() => handleQueueClick('AG-T001')}
            className="bg-mint-light rounded-2xl border-[2px] border-navy-border p-4 shadow-bento-sm flex flex-col justify-between relative overflow-hidden cursor-pointer hover:shadow-bento transition-all"
          >
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-mint-foam rounded-full -z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-saffron text-navy-border font-mono text-xs font-black border border-navy-border">
                  AG-T001
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-black text-forest uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span> ON SCALE
                </span>
              </div>
              <h4 className="font-display font-extrabold text-sm text-navy-border truncate">Ramesh Patel</h4>
              <div className="font-mono text-xs text-forest-light font-bold mt-0.5">Bolero GJ-05-EG-4412 • Olpad</div>
              <div className="mt-3 p-2 bg-white/80 rounded-xl border border-navy-border/30 text-xs">
                <div className="font-bold text-navy-border">Lokwan Sharbati Wheat</div>
                <div className="font-mono text-[11px] text-forest font-bold">10.00 MT (Declared)</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-navy-border/10 flex items-center justify-between relative z-10">
              <span className="font-mono text-[11px] font-bold text-slate-500">Slot: 08:00 AM</span>
              <button className="px-3 py-1 bg-forest text-white rounded-lg font-mono text-xs font-bold border border-navy-border">
                ACTIVE
              </button>
            </div>
          </div>

          {/* Token Card 2: Standby #1 */}
          <div
            onClick={() => handleQueueClick('AG-T002')}
            className="bg-white rounded-2xl border-[2px] border-navy-border p-4 shadow-bento-sm flex flex-col justify-between hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-periwinkle text-indigo-900 font-mono text-xs font-black border border-navy-border">
                  AG-T002
                </span>
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">WAIT: ~4 MIN</span>
              </div>
              <h4 className="font-display font-extrabold text-sm text-navy-border truncate">Suresh Chaudhary</h4>
              <div className="font-mono text-xs text-slate-500 font-bold mt-0.5">Tata 407 GJ-05-AH-2091 • Bardoli</div>
              <div className="mt-3 p-2 bg-canvas rounded-xl border border-navy-border/20 text-xs">
                <div className="font-bold text-navy-border">Basmati Rice (Paddy)</div>
                <div className="font-mono text-[11px] text-slate-600 font-bold">15.00 MT (Declared)</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-slate-400">Slot: 08:30 AM</span>
              <button className="px-3 py-1 bg-mint-foam hover:bg-mint-light text-forest rounded-lg font-mono text-xs font-bold border border-navy-border">
                CALL IN
              </button>
            </div>
          </div>

          {/* Token Card 3: Standby #2 */}
          <div
            onClick={() => handleQueueClick('AG-T003')}
            className="bg-white rounded-2xl border-[2px] border-navy-border p-4 shadow-bento-sm flex flex-col justify-between hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-canvas text-navy-border font-mono text-xs font-black border border-navy-border">
                  AG-T003
                </span>
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">WAIT: ~12 MIN</span>
              </div>
              <h4 className="font-display font-extrabold text-sm text-navy-border truncate">Mahesh Parmar</h4>
              <div className="font-mono text-xs text-slate-500 font-bold mt-0.5">Supro GJ-19-BD-9081 • Kamrej</div>
              <div className="mt-3 p-2 bg-canvas rounded-xl border border-navy-border/20 text-xs">
                <div className="font-bold text-navy-border">Yellow Maize (Corn)</div>
                <div className="font-mono text-[11px] text-slate-600 font-bold">8.00 MT (Declared)</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-slate-400">Slot: 09:00 AM</span>
              <button className="px-3 py-1 bg-white hover:bg-slate-100 text-navy-border rounded-lg font-mono text-xs font-bold border border-navy-border">
                INSPECT
              </button>
            </div>
          </div>

          {/* Token Card 4: Standby #3 */}
          <div
            onClick={() => handleQueueClick('AG-T004')}
            className="bg-white rounded-2xl border-[2px] border-navy-border p-4 shadow-bento-sm flex flex-col justify-between hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-saffron-light text-saffron-dark font-mono text-xs font-black border border-navy-border">
                  AG-T004
                </span>
                <span className="font-mono text-[10px] font-bold text-saffron-dark uppercase">DOCS PENDING</span>
              </div>
              <h4 className="font-display font-extrabold text-sm text-navy-border truncate">Kiran Desai</h4>
              <div className="font-mono text-xs text-slate-500 font-bold mt-0.5">Eicher GJ-05-DC-0199 • Palsana</div>
              <div className="mt-3 p-2 bg-canvas rounded-xl border border-navy-border/20 text-xs">
                <div className="font-bold text-navy-border">Medium Staple Cotton</div>
                <div className="font-mono text-[11px] text-slate-600 font-bold">12.00 MT (Declared)</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-slate-400">Slot: 09:30 AM</span>
              <button className="px-3 py-1 bg-white hover:bg-slate-100 text-navy-border rounded-lg font-mono text-xs font-bold border border-navy-border">
                INSPECT
              </button>
            </div>
          </div>
        </div>

        {/* Footer info strip */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs font-bold text-slate-500">
          <div>SHOWING 4 OF {stats?.total_bookings || 25} SLOTTED INBOUND TRUCKS • AUTO-SLOT DISPATCH READY</div>
          <div className="flex items-center gap-2">
            <Link
              href="/farmer"
              className="px-3.5 py-1.5 rounded-xl bg-forest hover:bg-forest-light border-[1.5px] border-navy-border text-white shadow-bento-sm active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <span>Book New Slot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4: Services We Provide for Farmers & Mandis */}
      <section className="bg-white p-6 sm:p-7 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-[2px] border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-light border-[1.5px] border-navy-border text-xs font-mono font-bold text-saffron-dark mb-2">
              <Tractor className="w-3.5 h-3.5" />
              <span>{t('servicesBadge')}</span>
            </div>
            <h3 className="font-display font-black text-2xl text-navy-border">{t('servicesTitle')}</h3>
            <p className="font-mono text-xs text-slate-500 font-bold mt-0.5">
              {t('servicesSubtitle')}
            </p>
          </div>
          <Link
            href="/farmer"
            className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>{t('bookYourSlot')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Service 1: Advance Slot Booking */}
          <div className="p-5 rounded-2xl bg-canvas border-[2px] border-navy-border shadow-bento-sm flex flex-col justify-between space-y-3 hover:bg-mint-light/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-forest text-saffron flex items-center justify-center border border-navy-border font-bold">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <span className="font-display font-black text-sm text-navy-border">Advance Slot Booking</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-mint-foam text-forest font-mono text-[9px] font-black border border-navy-border">
                  ZERO QUEUE
                </span>
              </div>
              <p className="font-mono text-xs text-slate-600 font-semibold leading-relaxed">
                Reserve your arrival date and time window online before leaving the village. Guarantees priority yard entry and eliminates 6–8 hour traffic delays.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 font-mono text-[10.5px] text-forest font-bold flex items-center justify-between">
              <span>Hourly Capacity Tracking</span>
              <Link href="/farmer" className="underline hover:text-navy-border">Reserve &rarr;</Link>
            </div>
          </div>

          {/* Service 2: Digital Gate-Pass Token */}
          <div className="p-5 rounded-2xl bg-canvas border-[2px] border-navy-border shadow-bento-sm flex flex-col justify-between space-y-3 hover:bg-mint-light/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-saffron text-navy-border flex items-center justify-center border border-navy-border font-bold">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <span className="font-display font-black text-sm text-navy-border">Digital Gate-Pass Token</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-saffron text-navy-border font-mono text-[9px] font-black border border-navy-border">
                  AG-T******
                </span>
              </div>
              <p className="font-mono text-xs text-slate-600 font-semibold leading-relaxed">
                Instant collision-proof token slip with SMS notification and printable QR barcode. Simply show your SMS or printed pass at Gate 02.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 font-mono text-[10.5px] text-forest font-bold flex items-center justify-between">
              <span>SMS &amp; Printable Slips</span>
              <Link href="/verify" className="underline hover:text-navy-border">Verify Pass &rarr;</Link>
            </div>
          </div>

          {/* Service 3: Certified Electronic Weighbridge */}
          <div className="p-5 rounded-2xl bg-canvas border-[2px] border-navy-border shadow-bento-sm flex flex-col justify-between space-y-3 hover:bg-mint-light/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-forest text-saffron flex items-center justify-center border border-navy-border font-bold">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="font-display font-black text-sm text-navy-border">Certified Weighbridge</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-periwinkle text-indigo-900 font-mono text-[9px] font-black border border-navy-border">
                  ±0.0% VARIANCE
                </span>
              </div>
              <p className="font-mono text-xs text-slate-600 font-semibold leading-relaxed">
                Electronic load cell sensors measure gross vehicle and tare deduction in under 2 minutes. Digital readout prevents weight discrepancies.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 font-mono text-[10.5px] text-forest font-bold">
              Instant Tare &amp; Net Load Slip
            </div>
          </div>

          {/* Service 4: Fair Quality Grading */}
          <div className="p-5 rounded-2xl bg-canvas border-[2px] border-navy-border shadow-bento-sm flex flex-col justify-between space-y-3 hover:bg-mint-light/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-forest text-saffron flex items-center justify-center border border-navy-border font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="font-display font-black text-sm text-navy-border">Quality Inspection</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-mint-light text-forest font-mono text-[9px] font-black border border-navy-border">
                  GRADE A / B / C
                </span>
              </div>
              <p className="font-mono text-xs text-slate-600 font-semibold leading-relaxed">
                Objective moisture meters and purity grading ensure your produce receives fair auction prices based on real commodity quality.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 font-mono text-[10.5px] text-forest font-bold">
              Transparent e-NAM Standards
            </div>
          </div>

          {/* Service 5: Direct UPI Bank Settlements */}
          <div className="p-5 rounded-2xl bg-canvas border-[2px] border-navy-border shadow-bento-sm flex flex-col justify-between space-y-3 hover:bg-mint-light/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-saffron text-navy-border flex items-center justify-center border border-navy-border font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="font-display font-black text-sm text-navy-border">Direct UPI Payouts</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-saffron text-navy-border font-mono text-[9px] font-black border border-navy-border">
                  INSTANT CREDIT
                </span>
              </div>
              <p className="font-mono text-xs text-slate-600 font-semibold leading-relaxed">
                Sale revenue is released straight to your registered UPI ID or Bank Account immediately after auction. Zero unapproved middleman commissions.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 font-mono text-[10.5px] text-forest font-bold">
              Automated Digital Payment Receipts
            </div>
          </div>

          {/* Service 6: Warehouse & Cold Storage */}
          <div className="p-5 rounded-2xl bg-canvas border-[2px] border-navy-border shadow-bento-sm flex flex-col justify-between space-y-3 hover:bg-mint-light/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-forest text-saffron flex items-center justify-center border border-navy-border font-bold">
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <span className="font-display font-black text-sm text-navy-border">Depot Storage Allotment</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-lilac text-lilac-dark font-mono text-[9px] font-black border border-navy-border">
                  COLD LOGISTICS
                </span>
              </div>
              <p className="font-mono text-xs text-slate-600 font-semibold leading-relaxed">
                Safe storage in ventilated tuber ramps, bulk grain silos, or cold logistics vaults for unsold produce or future auction releases.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 font-mono text-[10.5px] text-forest font-bold">
              Protected Produce Warehousing
            </div>
          </div>
        </div>
      </section>

      {/* POPUP: GATE PASS MODAL */}
      {showGatePassModal && activeBooking && (
        <GatePassModal
          booking={activeBooking}
          onClose={() => setShowGatePassModal(false)}
          onOpenSms={() => setShowSmsModal(true)}
        />
      )}

      {/* POPUP: SIMULATED SMS / WHATSAPP NOTIFICATION MODAL */}
      {showSmsModal && activeBooking && (
        <SmsNotificationModal
          booking={activeBooking}
          onClose={() => setShowSmsModal(false)}
          onOpenGatePass={() => setShowGatePassModal(true)}
        />
      )}
    </div>
  );
}
