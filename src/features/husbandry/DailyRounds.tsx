import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Check, X, Droplets, Lock, Heart, AlertTriangle, Loader2, ClipboardCheck
} from 'lucide-react';
import { dailyRoundService } from '../../services/dailyRoundService';
import { Animal, DailyRound } from '../../types/schema';
import { supabase } from '../../lib/supabase';

type ReportType = 'HEALTH' | 'WATER' | 'SECURE';

export default function DailyRounds() {
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [roundType, setRoundType] = useState<'Morning' | 'Evening'>('Morning');
  
  const [activeCategory, setActiveCategory] = useState<string>('OWLS');
  const categories = ['OWLS', 'RAPTORS', 'MAMMALS', 'EXOTICS'];
  
  const [pendingChecks, setPendingChecks] = useState<Record<string, Partial<DailyRound>>>({});
  const [reportModal, setReportModal] = useState<{ open: boolean, animalId: string | null, type: ReportType | null }>({ open: false, animalId: null, type: null });
  const [issueText, setIssueText] = useState('');

  // 1. Data Fetch
  const { data: animals = [], isLoading } = useQuery({ 
    queryKey: ['animals'], 
    queryFn: async () => {
        const { data } = await supabase.from('animals').select('*').eq('is_deleted', false);
        return data as Animal[];
    }
  });

  // 2. Filter by Tab (No Location Grouping - Unified with Daily Logs)
  const activeAnimals = animals
    .filter(a => (a.category || '').toUpperCase() === activeCategory)
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));

  // 3. Tri-State Logic per ZLA Button
  const toggleSpecific = (animal: Animal, type: ReportType) => {
    const current = pendingChecks[animal.id!] || {};
    
    let key: keyof Partial<DailyRound> = 'is_alive';
    if (type === 'WATER') key = 'water_checked';
    if (type === 'SECURE') key = 'locks_secured';

    const val = current[key];

    if (val === undefined) {
        setPendingChecks(prev => ({ ...prev, [animal.id!]: { ...prev[animal.id!], [key]: true } }));
    } else if (val === true) {
        setReportModal({ open: true, animalId: animal.id!, type });
    } else {
        setPendingChecks(prev => {
            const next = { ...prev[animal.id!] };
            delete next[key];
            if (Object.keys(next).length === 0) {
                const newState = { ...prev };
                delete newState[animal.id!];
                return newState;
            }
            return { ...prev, [animal.id!]: next };
        });
    }
  };

  const confirmIssue = () => {
    if (!reportModal.animalId || !issueText) return;
    
    let key: keyof Partial<DailyRound> = 'is_alive';
    let noteKey: keyof Partial<DailyRound> = 'animal_issue_note';
    
    if (reportModal.type === 'WATER' || reportModal.type === 'SECURE') {
        key = reportModal.type === 'WATER' ? 'water_checked' : 'locks_secured';
        noteKey = 'general_section_note'; 
    }

    setPendingChecks(prev => ({
        ...prev,
        [reportModal.animalId!]: { 
            ...prev[reportModal.animalId!], 
            [key]: false, 
            [noteKey]: issueText 
        }
    }));
    setReportModal({ open: false, animalId: null, type: null });
    setIssueText('');
  };

  const handleSignOff = async () => {
    const roundsToSave = Object.entries(pendingChecks).map(([id, data]) => ({
        animal_id: id,
        date: viewDate,
        shift: roundType,
        completed_at: new Date().toISOString(),
        ...data
    }));
    await dailyRoundService.bulkSaveRound(roundsToSave as DailyRound[]);
    setPendingChecks({});
  };

  const renderButton = (animal: Animal, type: ReportType) => {
    const status = pendingChecks[animal.id!];
    let key: keyof Partial<DailyRound> = 'is_alive';
    if (type === 'WATER') key = 'water_checked';
    if (type === 'SECURE') key = 'locks_secured';

    const val = status?.[key];
    
    let Icon = Heart;
    let text = 'PENDING';
    let styleClass = 'bg-[#0A0B0E] text-slate-600 border-slate-800/80 hover:bg-slate-800/50 hover:text-emerald-400 hover:border-emerald-500/50';

    if (val === true) {
        Icon = Check;
        text = 'OK';
        styleClass = 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-inner';
    } else if (val === false) {
        Icon = type === 'HEALTH' ? AlertTriangle : X;
        text = 'ISSUE';
        styleClass = 'bg-rose-600/10 text-rose-400 border-rose-500/20 shadow-inner';
    } else {
        if (type === 'WATER') Icon = Droplets;
        if (type === 'SECURE') Icon = Lock;
    }

    return (
        <button 
            onClick={() => toggleSpecific(animal, type)}
            className={`w-full py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border ${styleClass}`}
        >
            <Icon size={14} className={val === undefined ? "opacity-50" : ""} />
            {text}
        </button>
    );
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      {/* Header Unification (No Icon, Tight Typography) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Daily Rounds</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">ZLA Compliance & Field Verification</p>
        </div>
      </div>

      {/* Unified Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="flex items-center gap-2 w-full sm:w-auto bg-[#0A0B0E] p-1.5 rounded-xl border border-slate-800/80 shadow-inner">
            <button 
                onClick={() => setRoundType('Morning')}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${roundType === 'Morning' ? 'bg-amber-600/20 text-amber-500 border border-amber-500/30 shadow-sm' : 'text-slate-500 hover:text-white border border-transparent'}`}
            >
                AM Shift
            </button>
            <button 
                onClick={() => setRoundType('Evening')}
                className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${roundType === 'Evening' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm' : 'text-slate-500 hover:text-white border border-transparent'}`}
            >
                PM Shift
            </button>
        </div>
        
        <button 
            onClick={handleSignOff} 
            disabled={Object.keys(pendingChecks).length === 0}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${Object.keys(pendingChecks).length > 0 ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-inner hover:bg-emerald-600 hover:text-white' : 'bg-[#0A0B0E] border border-slate-800/80 text-slate-600 cursor-not-allowed'}`}
        >
          <ClipboardCheck size={14} /> Submit {Object.keys(pendingChecks).length} Records
        </button>
      </div>

      {/* Unified Category Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide bg-[#0F1117] border border-slate-800/80 p-1.5 rounded-2xl gap-1 shadow-inner">
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)} 
            className={`flex-1 min-w-[100px] py-2.5 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-[#0A0B0E]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Unified Table Layout */}
      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-2/5">Animal</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/5">Health</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/5">Water</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/5">Secure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Accessing Vault...</td></tr>
              ) : activeAnimals.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest">No animals in this section</td></tr>
              ) : (
                activeAnimals.map((animal) => (
                  <tr key={animal.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#0F1117] border border-slate-800/80 shadow-inner flex items-center justify-center overflow-hidden shrink-0">
                          {animal.image_url ? <img src={animal.image_url} className="w-full h-full object-cover" /> : <span className="text-xs font-black text-slate-600">{animal.name?.charAt(0) || '?'}</span>}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{animal.name || 'Unnamed'}</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{animal.species}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{renderButton(animal, 'HEALTH')}</td>
                    <td className="px-4 py-3 text-center">{renderButton(animal, 'WATER')}</td>
                    <td className="px-4 py-3 text-center">{renderButton(animal, 'SECURE')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Issue Reporting Modal */}
      {reportModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#0F1117] border border-slate-800/80 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1 flex items-center gap-2">
                    <AlertTriangle className="text-rose-500" size={24} />
                    Report {reportModal.type} Issue
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-6 tracking-widest">This note will be attached to the formal ZLA log.</p>
                
                <textarea 
                    autoFocus
                    value={issueText} 
                    onChange={(e) => setIssueText(e.target.value)} 
                    className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl p-4 text-sm font-medium text-white mb-6 focus:outline-none focus:border-rose-500/50 resize-none h-32 shadow-inner"
                    placeholder="Provide required observation details..."
                />
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => setReportModal({ open: false, animalId: null, type: null })} 
                        className="flex-1 bg-[#13161E] border border-slate-800/80 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmIssue} 
                        disabled={!issueText}
                        className="flex-1 bg-rose-600/20 text-rose-400 border border-rose-500/30 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 hover:bg-rose-600 hover:text-white transition-all shadow-inner"
                    >
                        Confirm Log
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}