'use client';

import React, { useState } from 'react';
import { 
  X, 
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
  QrCode,
  Truck,
  Download,
  MessageSquare
} from 'lucide-react';

export default function GatePassModal({ booking, onClose, onOpenSms }) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!booking) return null;

  const tokenCode = booking.Gate_Pass_Token || booking.Token_Number || booking.tokenNumber || 'AG-T10001';
  const farmerName = booking.Farmer_Name || booking.farmerName || booking.Name || 'Registered Producer';
  const phone = booking.Phone_Number || booking.Farmer_Phone || booking.phone || 'N/A';
  const bookingStatus = booking.Booking_Status || booking.bookingStatus || 'Confirmed';
  const mandiName = booking.Mandi_Name || booking.mandiName || 'APMC Main Yard';
  const district = booking.District || booking.district || 'Gujarat Central';
  const produceName = booking.Produce_Name || booking.produceName || 'Agricultural Produce';
  const weightTons = Number(booking.Estimated_Weight_Tons || booking.estimatedWeightTons || 4.5);
  const bookingId = booking.Booking_ID || booking.bookingId || '101';
  const slotDate = booking.Slot_Date || booking.slotDate;
  const startTime = booking.Start_Time || booking.startTime;
  const endTime = booking.End_Time || booking.endTime;

  const copyToken = () => {
    if (tokenCode) {
      navigator.clipboard.writeText(tokenCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSlip = () => {
    const slipContent = `=======================================================
           APMC MANDI OFFICIAL GATE-PASS SLIP
=======================================================
Token Code    : ${tokenCode}
Pass ID       : #BK-${bookingId}
Market Yard   : ${mandiName} (${district})
Producer      : ${farmerName}
Contact       : ${phone}
Commodity     : ${produceName}
Weight        : ${weightTons.toFixed(2)} Tons (${(weightTons * 1000).toLocaleString()} KG)
Arrival Slot  : ${slotDate ? new Date(slotDate).toLocaleDateString() : 'Today'} (${startTime ? `${String(startTime).slice(0, 5)} - ${String(endTime || '').slice(0, 5)}` : '09:00 - 13:00'})
Status        : ${bookingStatus}
Assigned Dock : Bay 04 (Bulk Onion & Grain Dock)
Verification  : Gate 02 Fast-Track Weighbridge
=======================================================
Presented to APMC Weighbridge Operator upon Arrival.
Toll-Free Support: 1800-AGRI-SLOT
=======================================================`;

    const blob = new Blob([slipContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GatePass_${tokenCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const statusNormalized = String(bookingStatus).toUpperCase();
  const isConfirmed = statusNormalized === 'CONFIRMED';
  const isCheckedIn = statusNormalized === 'CHECKED-IN' || statusNormalized === 'CHECKED_IN';
  const isCompleted = statusNormalized === 'COMPLETED';
  const isCancelled = statusNormalized === 'CANCELLED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/60 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg overflow-hidden print:border-none print:shadow-none animate-in fade-in zoom-in-95 duration-200">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-mint-foam border-b-[2px] border-navy-border print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot"></span>
            <span className="font-mono text-xs font-black text-forest uppercase tracking-wider">
              APMC OFFICIAL GATE-PASS TICKET
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border-[1.5px] border-navy-border font-mono text-xs font-bold text-navy-border shadow-bento-sm active:translate-y-0.5 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Pass</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white hover:bg-rose-50 border-[1.5px] border-navy-border text-navy-border active:translate-y-0.5"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Perforated Boarding Pass Ticket Body */}
        <div className="p-6 sm:p-8 bg-canvas">
          <div className="bg-white rounded-2xl border-[2.5px] border-navy-border shadow-bento flex flex-col sm:flex-row relative overflow-hidden">
            {/* Main Ticket Stub */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b-2 border-slate-100">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-mint-foam border border-navy-border text-forest font-mono text-[10px] font-black uppercase">
                    AUTHORIZATION PASS
                  </span>
                  <h3 className="font-display font-black text-xl text-navy-border mt-1">
                    {mandiName}
                  </h3>
                  <p className="font-mono text-xs text-slate-500 font-semibold">
                    District: {district} • Inbound Gate #02
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full font-mono text-xs font-black uppercase border-[1.5px] border-navy-border ${
                      isConfirmed
                        ? 'bg-mint-light text-forest'
                        : isCheckedIn
                        ? 'bg-periwinkle text-indigo-900'
                        : isCompleted
                        ? 'bg-lilac text-lilac-dark'
                        : 'bg-coral text-coral-dark'
                    }`}
                  >
                    {bookingStatus}
                  </span>
                </div>
              </div>

              {/* Token Highlight Box */}
              <div className="p-4 bg-mint-light rounded-xl border-[2px] border-navy-border flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase text-forest-light block">
                    COLLISION-PROOF GATE TOKEN
                  </span>
                  <div className="font-mono font-black text-2xl sm:text-3xl text-navy-border tracking-wider">
                    {tokenCode}
                  </div>
                </div>
                <button
                  onClick={copyToken}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border-[1.5px] border-navy-border text-navy-border font-mono text-xs font-bold shadow-bento-sm active:translate-y-0.5 print:hidden flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-canvas rounded-xl border-[1.5px] border-navy-border">
                  <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block">Producer</span>
                  <span className="font-display font-black text-navy-border text-sm block">
                    {farmerName}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">{phone}</span>
                </div>

                <div className="p-3 bg-canvas rounded-xl border-[1.5px] border-navy-border">
                  <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block">Arrival Slot</span>
                  <span className="font-display font-black text-navy-border text-sm block">
                    {slotDate ? new Date(slotDate).toLocaleDateString() : 'Today'}
                  </span>
                  <span className="font-mono text-[11px] text-forest font-bold">
                    {startTime ? `${String(startTime).slice(0, 5)} - ${String(endTime || '').slice(0, 5)}` : '09:00 - 13:00'}
                  </span>
                </div>

                <div className="p-3 bg-canvas rounded-xl border-[1.5px] border-navy-border">
                  <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block">Commodity</span>
                  <span className="font-display font-black text-navy-border text-sm block">
                    {produceName}
                  </span>
                </div>

                <div className="p-3 bg-canvas rounded-xl border-[1.5px] border-navy-border">
                  <span className="font-mono text-[10px] uppercase font-bold text-slate-400 block">Weight</span>
                  <span className="font-display font-black text-navy-border text-sm block">
                    {weightTons.toFixed(2)} Tons
                  </span>
                  <span className="font-mono text-[11px] text-forest font-bold">
                    {(weightTons * 1000).toLocaleString()} KG
                  </span>
                </div>
              </div>
            </div>

            {/* Perforated Tear-off Coupon Stub */}
            <div className="sm:w-40 bg-saffron-light border-t-[2.5px] sm:border-t-0 sm:border-l-[2.5px] border-dashed border-navy-border p-5 flex sm:flex-col items-center justify-between text-center relative">
              {/* Circular punch cutouts */}
              <div className="hidden sm:block absolute -top-3 left-[-11px] w-5 h-5 rounded-full bg-canvas border-[2.5px] border-navy-border"></div>
              <div className="hidden sm:block absolute -bottom-3 left-[-11px] w-5 h-5 rounded-full bg-canvas border-[2.5px] border-navy-border"></div>

              <span className="font-mono text-[10px] font-black text-navy-border uppercase tracking-widest sm:[writing-mode:vertical-rl] sm:rotate-180">
                GATE ENTRY COUPON
              </span>

              <div className="w-20 h-20 bg-white p-1.5 rounded-xl border-[2px] border-navy-border shadow-bento-sm flex items-center justify-center my-3">
                <QrCode className="w-16 h-16 text-navy-border" />
              </div>

              <div>
                <span className="font-mono text-[10px] font-bold text-slate-600 block">PASS SLIP</span>
                <span className="font-mono font-black text-xs text-navy-border">#{bookingId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-white border-t-[2px] border-navy-border flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="text-xs font-mono text-slate-500 font-semibold flex items-center gap-2">
            <span>Show SMS or this printed pass at Gate 02.</span>
            {onOpenSms && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSms();
                }}
                className="text-forest hover:text-navy-border underline font-bold flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>View Phone SMS</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadSlip}
              className="px-3.5 py-2 rounded-xl bg-mint-light hover:bg-mint-foam border-[1.5px] border-navy-border font-mono text-xs font-bold text-forest shadow-bento-sm active:translate-y-0.5 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloaded ? 'Saved!' : 'Download Slip'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-saffron" />
              <span>Print Pass</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-canvas hover:bg-slate-100 border-[1.5px] border-navy-border font-display font-bold text-xs text-navy-border"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
