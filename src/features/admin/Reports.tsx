import React from 'react';
import { BarChart3, Download, FileText, Activity, ShieldAlert, HeartPulse } from 'lucide-react';

export default function Reports() {
  const reportTypes = [
    { id: 'husbandry', title: 'Husbandry Activity', description: 'Daily logs, feeding, and enrichment metrics over time.', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'clinical', title: 'Clinical Summary', description: 'Medical records, medication adherence, and quarantine status.', icon: HeartPulse, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'safety', title: 'Safety Incidents', description: 'Fire drills, first aid logs, and facility maintenance overview.', icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'zla', title: 'ZLA Audit Export', description: 'Complete Zoo Licensing Act compliance dataset for inspection.', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Reports</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Document Generation & Analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => (
          <div key={report.id} className="bg-[#0F1117] border border-slate-800/80 rounded-2xl p-6 shadow-inner flex flex-col h-full hover:border-slate-700 transition-colors">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${report.bg}`}>
                <report.icon size={24} className={report.color} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">{report.title}</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 leading-relaxed">{report.description}</p>
              </div>
            </div>
            <div className="mt-auto pt-4 flex gap-3 border-t border-slate-800/80">
              <button className="flex-1 py-2 bg-[#0A0B0E] border border-slate-800/80 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-slate-800/50 transition-colors flex items-center justify-center gap-2">
                <FileText size={14} /> View
              </button>
              <button className="flex-1 py-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2">
                <Download size={14} /> Export PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
