'use client';

import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Copy, 
  Check, 
  Share2, 
  Printer, 
  QrCode, 
  CheckCircle2, 
  Phone,
  Signal,
  Wifi,
  Battery
} from 'lucide-react';

export default function SmsNotificationModal({ booking, onClose, onOpenGatePass }) {
  const [copied, setCopied] = useState(false);
  const [channel, setChannel] = useState('sms'); // 'sms' | 'whatsapp'

  if (!booking) return null;

  const token = booking.Token_Number || booking.Gate_Pass_Token || 'AG-T001';
  const farmerName = booking.Farmer_Name || 'Ramesh Patel';
  const phone = booking.Farmer_Phone || booking.Phone || '9000000001';
  const produce = booking.Produce_Name || 'Lokwan Sharbati Wheat';
  const weight = booking.Estimated_Weight_Tons || 10.0;
  const mandi = booking.Mandi_Name || 'Surat APMC Mandi';
  const village = booking.Village || 'Olpad';
  const slotDate = booking.Slot_Date ? String(booking.Slot_Date).slice(0, 10) : '2026-10-25';
  const slotTime = booking.Start_Time && booking.End_Time 
    ? `${booking.Start_Time.slice(0, 5)} - ${booking.End_Time.slice(0, 5)}`
    : '08:00 AM - 10:00 AM';

  const rawSmsText = `[GOVT OF GUJARAT - APMC MANDI]
GATE PASS ISSUED: #${token}
Farmer: ${farmerName} (${village})
Commodity: ${produce} (${weight} MT)
Mandi: ${mandi}
Slot Window: ${slotDate} ${slotTime}
Assigned Dock: Bay 04 (Bulk Onion & Grain Dock)
Status: APPROVED & CONFIRMED FOR GATE 02 ENTRY

Show this SMS or QR code at Gate 02 weighbridge.
Toll-free Support: 1800-AGRI-SLOT`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawSmsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/60 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-sm bg-slate-900 rounded-[38px] p-4 border-[3px] border-navy-border shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Smartphone Dynamic Island / Notch */}
        <div className="w-28 h-5 bg-black rounded-full mx-auto mb-2 flex items-center justify-end px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
        </div>

        {/* Smartphone Screen Glass */}
        <div className="bg-canvas rounded-[28px] overflow-hidden border border-slate-300 flex flex-col justify-between shadow-inner">
          {/* Status Bar */}
          <div className="px-4 pt-2.5 pb-1 flex items-center justify-between text-[11px] font-mono font-bold text-slate-700 border-b border-slate-200">
            <span>09:42</span>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Channel Switcher Tab (SMS vs WhatsApp) */}
          <div className="p-2 bg-white flex items-center justify-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setChannel('sms')}
              className={`flex-1 py-1.5 px-3 rounded-xl font-mono text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                channel === 'sms'
                  ? 'bg-forest text-saffron shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>SMS Alert</span>
            </button>
            <button
              onClick={() => setChannel('whatsapp')}
              className={`flex-1 py-1.5 px-3 rounded-xl font-mono text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                channel === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>WhatsApp</span>
            </button>
          </div>

          {/* SMS / WhatsApp View Area */}
          <div className="p-3.5 space-y-3 min-h-[350px] flex flex-col justify-between">
            {channel === 'sms' ? (
              /* SMS Notification Bubble */
              <div className="space-y-2">
                <div className="text-center font-mono text-[10px] text-slate-400 font-bold">
                  Today • 09:41 AM • SIM 1 (Airtel)
                </div>

                <div className="bg-white p-3.5 rounded-2xl rounded-tl-sm border-[1.5px] border-slate-300 shadow-sm font-mono text-xs space-y-2 text-slate-800">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-black text-forest uppercase tracking-wider">
                      VK-APMCGJ (GOVT SENDER)
                    </span>
                    <span className="text-[10px] bg-mint-foam px-1.5 py-0.5 rounded text-forest font-bold">
                      VERIFIED
                    </span>
                  </div>

                  <p className="font-bold text-navy-border leading-snug">
                    APMC MANDI PASS CONFIRMED: <span className="text-forest font-black">#{token}</span>
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Dear <span className="font-bold text-navy-border">{farmerName}</span>, your entry slot for{' '}
                    <span className="font-bold">{produce}</span> ({weight} MT) at{' '}
                    <span className="font-bold">{mandi}</span> is confirmed for{' '}
                    <span className="font-bold">{slotDate} ({slotTime})</span>.
                  </p>
                  <div className="p-2 bg-mint-light/50 rounded-xl border border-forest/20 text-[10.5px]">
                    <div className="font-bold text-forest">Assigned Dock: Bay 04 (Bulk Onion & Grain Dock)</div>
                    <div className="text-slate-500">Show this SMS at Gate 02 Weighbridge.</div>
                  </div>
                </div>
              </div>
            ) : (
              /* WhatsApp Business Notification Bubble */
              <div className="space-y-2">
                <div className="bg-emerald-700 text-white p-2 rounded-xl flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white text-emerald-700 font-black flex items-center justify-center text-xs">
                      AP
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-1">
                        <span>APMC Mandi Portal</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      </div>
                      <div className="text-[9px] text-emerald-200">Official Business Account</div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#E7FFDB] p-3.5 rounded-2xl rounded-tl-sm border border-emerald-300 shadow-sm font-mono text-xs space-y-2 text-slate-800">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>🌾 APMC Gate Pass Notification</span>
                    <span className="text-[9px] text-slate-400">09:42</span>
                  </div>

                  <div className="text-[11.5px] space-y-1">
                    <div><strong>Token:</strong> <span className="text-emerald-800 font-bold">#{token}</span></div>
                    <div><strong>Farmer:</strong> {farmerName} ({village})</div>
                    <div><strong>Produce:</strong> {produce} • {weight} MT</div>
                    <div><strong>Slot:</strong> {slotDate} | {slotTime}</div>
                    <div><strong>Assigned Ramp:</strong> Bay 04</div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px] text-emerald-900 font-bold">
                    <span>STATUS: APPROVED ENTRY</span>
                    <span className="text-emerald-700">✓✓ Delivered</span>
                  </div>
                </div>
              </div>
            )}

            {/* In-Phone Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-200 font-mono text-xs">
              <button
                onClick={handleCopy}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border-[1.5px] border-navy-border font-bold text-navy-border flex items-center justify-center gap-2 shadow-sm active:translate-y-0.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-forest" />
                    <span className="text-forest font-black">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SMS Text</span>
                  </>
                )}
              </button>

              {onOpenGatePass && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenGatePass();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-forest hover:bg-forest-light border-[1.5px] border-navy-border font-bold text-white flex items-center justify-center gap-2 shadow-sm active:translate-y-0.5"
                >
                  <Printer className="w-3.5 h-3.5 text-saffron" />
                  <span>View Thermal Gate Pass</span>
                </button>
              )}
            </div>
          </div>

          {/* Smartphone Home Bar */}
          <div className="py-2 flex justify-center bg-slate-100 border-t border-slate-200">
            <div className="w-24 h-1 bg-slate-400 rounded-full"></div>
          </div>
        </div>

        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-800 text-white hover:bg-coral border border-slate-600 flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
