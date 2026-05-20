import React from 'react';
import { Wrench } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Maintenance</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Enclosure & Facility Work Orders</p>
        </div>
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 p-12 text-center shadow-2xl flex flex-col items-center">
        <Wrench size={48} className="text-emerald-500 mb-4 opacity-50" />
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Coming Soon</h2>
        <p className="text-sm text-slate-400 mt-2 font-bold max-w-md mx-auto">The Maintenance and facility work orders system is under construction.</p>
      </div>
    </div>
  );
}
