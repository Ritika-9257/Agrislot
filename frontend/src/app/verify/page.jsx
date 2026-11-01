'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  QrCode, 
  Printer, 
  Copy, 
  Check, 
  MapPin, 
  Calendar, 
  Clock, 
  Wheat, 
  User, 
  Phone, 
  ShieldCheck, 
  AlertCircle,
  Truck,
  Camera
} from 'lucide-react';
import { AgriSlotAPI } from '@/lib/api';

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || 'AG-T001';

  const [tokenInput, setTokenInput] = useState(initialToken);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialToken) {
      handleVerify(initialToken);
    }
  }, [initialToken]);

  const handleVerify = async (tokenToVerify) => {
    const t = (tokenToVerify || tokenInput).trim();
    if (!t) {
      setError('Please enter a gate-pass token code');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setBooking(null);
      const res = await AgriSlotAPI.getBookingByToken(t);
      if (res.data) {
        setBooking(res.data);
      } else {
        setError('No active booking found for token: ' + t);
      }
    } catch (err) {
      setError(err.message || 'Token verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const copyToken = (tok) => {
    if (tok) {
      navigator.clipboard.writeText(tok);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sampleTokens = ['AG-T001', 'AG-T002', 'AG-T003', 'AG-T004', 'AG-T005'];

  const tokenCode = booking ? (booking.Token_Number || booking.Gate_Pass_Token || booking.tokenNumber || tokenInput) : '';
  const phone = booking ? (booking.Farmer_Phone || booking.Phone_Number || booking.phone || '9822014412') : '';
  const farmerName = booking ? (booking.Farmer_Name || booking.farmerName || 'Registered Producer') : '';
  const mandiName = booking ? (booking.Mandi_Name || booking.mandiName || 'Surat APMC Main Yard') : '';
  const district = booking ? (booking.District || booking.district || 'Surat') : '';
  const produceName = booking ? (booking.Produce_Name || booking.produceName || 'Produce') : '';
  const status = booking ? (booking.Booking_Status || booking.bookingStatus || 'Confirmed') : '';
  const weight = booking ? Number(booking.Estimated_Weight_Tons || booking.estimatedWeightTons || 4.5) : 4.5;
  const bookingId = booking ? (booking.Booking_ID || booking.bookingId || '101') : '101';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint-foam border-[1.5px] border-navy-border text-xs font-mono font-bold text-forest uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>APMC SECURITY GATE TERMINAL</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-black text-navy-border tracking-tight">
          Verify Gate-Pass Authorization
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-lg mx-auto">
          Scan RFID or input the collision-resistant token to authenticate farmer gate entry credentials.
        </p>
      </div>

      {/* Token Input Box */}
      <div className="bg-white p-6 sm:p-7 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4 print:hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <QrCode className="w-5 h-5 text-forest absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. AG-T10001"
              className="w-full h-12 pl-11 pr-4 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-mono text-sm font-bold text-navy-border placeholder:text-slate-400 focus:ring-0 focus:border-forest shadow-bento-sm uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento-sm hover:shadow-bento active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="font-mono text-xs">Authenticating...</span>
            ) : (
              <>
                <Search className="w-4 h-4 text-saffron" />
                <span>Verify Token</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Click Samples */}
        <div className="pt-2 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px]">Quick Test:</span>
          {sampleTokens.map((st) => (
            <button
              key={st}
              onClick={() => {
                setTokenInput(st);
                handleVerify(st);
              }}
              className="px-2.5 py-1 rounded-lg bg-mint-foam hover:bg-mint-light text-forest border border-navy-border transition-all shadow-sm active:translate-y-0.5"
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-2xl bg-coral/60 border-[2px] border-navy-border text-coral-dark font-mono text-xs font-bold flex items-center gap-2 shadow-bento-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Boarding Pass Ticket Presentation */}
      {booking && (
        <div className="bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento-lg overflow-hidden print:border-none print:shadow-none animate-in fade-in zoom-in-95 duration-200">
          {/* Top Banner */}
          <div className="px-6 py-3.5 bg-mint-foam border-b-[2px] border-navy-border flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot"></span>
              <span className="font-mono text-xs font-black text-forest uppercase">
                AUTHENTICATED PASS RECORD
              </span>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-50 border-[1.5px] border-navy-border font-mono text-xs font-bold text-navy-border shadow-bento-sm active:translate-y-0.5 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>

          <div className="p-6 sm:p-8 bg-canvas">
            <div className="bg-white rounded-2xl border-[2.5px] border-navy-border shadow-bento flex flex-col sm:flex-row relative overflow-hidden">
              {/* Ticket Left Section */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between pb-3 border-b-2 border-slate-100">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-saffron text-navy-border font-mono text-[10px] font-black uppercase border border-navy-border">
                      CLEARANCE STATUS: {status}
                    </span>
                    <h2 className="text-2xl font-display font-black text-navy-border mt-1">
                      {mandiName}
                    </h2>
                    <p className="font-mono text-xs text-slate-500 font-semibold">
                      District: {district} • Gate #02 Fast-Track Lane
                    </p>
                  </div>
                </div>

                {/* Token Hero Box */}
                <div className="p-4 bg-mint-light rounded-xl border-[2px] border-navy-border flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase text-forest-light">
                      OFFICIAL APMC TOKEN ID
                    </span>
                    <div className="font-mono font-black text-3xl text-navy-border tracking-wider">
                      {tokenCode}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToken(tokenCode)}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border-[1.5px] border-navy-border text-navy-border font-mono text-xs font-bold shadow-bento-sm print:hidden flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 bg-canvas rounded-xl border-[1.5px] border-navy-border">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Producer</span>
                    <span className="font-display font-black text-navy-border text-sm block">
                      {farmerName}
                    </span>
                    <span className="text-[11px] text-slate-500">Phone: {phone}</span>
                  </div>

                  <div className="p-3 bg-canvas rounded-xl border-[1.5px] border-navy-border">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Aadhaar Masked</span>
                    <span className="font-display font-black text-navy-border text-sm block">
                      {booking.Aadhaar_Masked || 'XXXX-XXXX-XXXX'}
                    </span>
                    <span className="text-[11px] text-forest font-bold">UID Verified</span>
                  </div>

                  <div className="p-3 bg-canvas rounded-xl border-[1.5px] border-navy-border">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Scheduled Arrival</span>
                    <span className="font-display font-black text-navy-border text-sm block">
                      {booking.Slot_Date ? new Date(booking.Slot_Date).toLocaleDateString() : 'Today'}
                    </span>
                    <span className="text-[11px] text-forest font-bold">
                      {booking.Start_Time ? `${String(booking.Start_Time).slice(0, 5)} - ${String(booking.End_Time || '').slice(0, 5)}` : '09:00 - 13:00'}
                    </span>
                  </div>

                  <div className="p-3 bg-canvas rounded-xl border-[1.5px] border-navy-border">
                    <span className="text-slate-400 font-bold block uppercase text-[10px]">Produce &amp; Load</span>
                    <span className="font-display font-black text-navy-border text-sm block">
                      {produceName} {booking.Category ? `(${booking.Category})` : ''}
                    </span>
                    <span className="text-[11px] text-navy-border font-bold">
                      {weight.toFixed(2)} MT ({(weight * 1000).toLocaleString()} KG)
                    </span>
                  </div>
                </div>
              </div>

              {/* Perforated Coupon Stub */}
              <div className="sm:w-44 bg-mint-foam border-t-[2.5px] sm:border-t-0 sm:border-l-[2.5px] border-dashed border-navy-border p-5 flex sm:flex-col items-center justify-between text-center relative">
                <div className="hidden sm:block absolute -top-3 left-[-11px] w-5 h-5 rounded-full bg-canvas border-[2.5px] border-navy-border"></div>
                <div className="hidden sm:block absolute -bottom-3 left-[-11px] w-5 h-5 rounded-full bg-canvas border-[2.5px] border-navy-border"></div>

                <span className="font-mono text-[10px] font-black text-forest uppercase tracking-widest sm:[writing-mode:vertical-rl] sm:rotate-180">
                  SECURITY BARCODE COUPON
                </span>

                <div className="w-24 h-24 bg-white p-2 rounded-xl border-[2px] border-navy-border shadow-bento-sm flex items-center justify-center my-3">
                  <QrCode className="w-20 h-20 text-navy-border" />
                </div>

                <div>
                  <span className="font-mono text-[10px] font-bold text-slate-500 block">PASS BOOKING ID</span>
                  <span className="font-mono font-black text-sm text-navy-border">#{bookingId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 font-mono text-slate-500">Loading gate verification terminal...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
