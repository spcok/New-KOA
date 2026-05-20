import React from 'react';
import { HelpCircle, BookOpen, AlertCircle, MessageSquare } from 'lucide-react';

export default function Help() {
  const guides = [
    { title: 'Husbandry Logging Protocol', category: 'General', desc: 'Standard operating procedures for entering daily feed, weights, and environmental checks.' },
    { title: 'ZLA Compliance Guide', category: 'Audit', desc: 'Understanding mandatory fields and maintaining audit-ready animal records.' },
    { title: 'Emergency Response Drill', category: 'Safety', desc: 'Step-by-step instructions for logging fire, safety, and escape drills.' },
    { title: 'Clinical Record Entry', category: 'Medical', desc: 'How to properly document SOAP notes and associate external vet visits.' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Help & Guides</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Keeper Operating Procedures</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-emerald-500" />
            Knowledge Base
          </h2>

          {guides.map((guide, idx) => (
            <div key={idx} className="bg-[#0F1117] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-colors cursor-pointer group">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">{guide.title}</h3>
                <span className="px-2 py-1 bg-[#0A0B0E] border border-slate-800 text-slate-400 rounded-md text-[10px] font-black uppercase tracking-widest">
                  {guide.category}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">{guide.desc}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
            <MessageSquare size={16} className="text-emerald-500" />
            Support
          </h2>

          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-6 text-center">
            <HelpCircle size={32} className="text-emerald-500 mx-auto mb-3" />
            <h3 className="text-sm font-black text-white mb-2 uppercase">Need Assistance?</h3>
            <p className="text-xs font-bold text-emerald-200/70 mb-4">Contact the Head Keeper or System Administrator for immediate support with the software.</p>
            <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
              Open Support Ticket
            </button>
          </div>

          <div className="bg-[#0A0B0E] border border-slate-800/80 rounded-2xl p-6 text-center">
            <AlertCircle size={32} className="text-amber-500 mx-auto mb-3 opacity-50" />
            <h3 className="text-sm font-black text-white mb-2 uppercase tracking-widest">System Status</h3>
            <p className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Systems Operational
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
