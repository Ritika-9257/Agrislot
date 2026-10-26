import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t-[2.5px] border-navy-border py-4 px-4 sm:px-8 mt-12">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs font-bold text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-forest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> APMC SERVICE GATEWAY: ACTIVE
          </span>
          <span>WEIGHBRIDGE CALIBRATION: ±0.0% VARIANCE</span>
          <span>FARMER HELPLINE: 1800-AGRI-SLOT</span>
        </div>
        <div className="text-navy-border font-extrabold uppercase tracking-wider text-center md:text-right">
          AGRISLOT APMC MANDI LOGISTICS
        </div>
      </div>
    </footer>
  );
}
