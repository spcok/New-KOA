import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    Check, X, Droplets, Lock, Heart, AlertTriangle, Loader2, ClipboardCheck, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import { dailyRoundService } from '../../services/dailyRoundService';
import { Animal, DailyRound } from '../../types/schema';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

type ReportType = 'HEALTH' | 'WATER' | 'SECURE';

export default function DailyRounds() {
  const session = useAuthStore(s => s.session);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [roundType, setRoundType] = useState<'Morning' | 'Evening'>('Morning');
  
  const [activeCategory, setActiveCategory] = useState<string>('OWLS');
  const categories = ['OWLS', 'RAPTORS', 'MAMMALS', 'EXOTICS'];
  
  const [pendingChecks, setPendingChecks] = useState<Record<string, Partial<DailyRound>>>({});
  const [reportModal, setReportModal] = useState<{ open: boolean, animalId: string | null, type: ReportType | null }>({ open: false, animalId: null, type: null });
  const [issueText, setIssueText] = useState('');

  // 1. Data Fetch: Animals
  const { data: animals = [], isLoading: loadingAnimals } = useQuery({ 
    queryKey: ['animals'], 
    queryFn: async () => {
        const { data } = await supabase.from('animals').select('*').eq('is_deleted', false);
        return data as Animal[];
    }
  });

  // 1. Data Fetch: Rounds (for the selected date)
  const { data: rounds = [], isLoading: loadingRounds } = useQuery({ 
    queryKey: ['daily_rounds', viewDate, roundType], 
    queryFn: async () => {
        const { data } = await supabase
            .from('daily_rounds')
            .select('*')
            .eq('date', viewDate)
            .eq('shift', roundType)
            .eq('is_deleted', false);
        return (data as DailyRound[]) || [];
    }
  });

  // Populate form with existing data
  useEffect(() => {
    if (rounds) {
      const initial: Record<string, Partial<DailyRound>> = {};
      rounds.forEach(r => {
        if (r.animal_id) initial[r.animal_id] = r;
      });
      setPendingChecks(initial);
    }
  }, [rounds]);

  const activeAnimals = animals
    .filter(a => (a.category || '').toUpperCase() === activeCategory)
    .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));

  const adjustDate = (days: number) => {
    const d = new Date(viewDate); d.setDate(d.getDate() + days);
    setViewDate(d.toISOString().split('T')[0]);
  };

  const toggleSpecific = (animal: Animal, type: ReportType) => {
    const current = pendingChecks[animal.id!] || {};
    let key: keyof Partial<DailyRound> = 'is_alive';
    if (type === 'WATER') key = 'water_checked';
    if (type === 'SECURE') key = 'locks_secured';

    const val = current[key];

    if (val === undefined || val === null) {
        setPendingChecks(prev => ({ ...prev, [animal.id!]: { ...prev[animal.id!], [key]: true } }));
    } else if (val === true) {
        setReportModal({ open: true, animalId: animal.id!, type });
    } else {
        setPendingChecks(prev => {
            const next = { ...prev[animal.id!] };
            delete next[key];
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
    if (!session?.user?.id) return;
    const roundsToSave = Object.entries(pendingChecks).map(([id, data]) => ({
        ...data,
        animal_id: id,
        date: viewDate,
        shift: roundType,
        completed_at: new Date().toISOString()
    }));
    await dailyRoundService.bulkSaveRound(roundsToSave as DailyRound[], session.user.id);
  };

  const renderButton = (animal: Animal, type: ReportType) => {
    const status = pendingChecks[animal.id!];
    let key: keyof Partial<DailyRound> = 'is_alive';
    if (type === 'WATER') key = 'water_checked';
    if (type === 'SECURE') key = 'locks_secured';

    const val = status?.[key];
    
    let Icon = Heart;
    let text = 'PENDING';
    let styleClass = 'bg-[#0A0B0E] text-slate-600 border-slate-800/80 hover:bg-slate-800/50';

    if (val === true) {
        Icon = Check;
        text = 'OK';
        styleClass = 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-inner';
    } else if (val === false) {
        Icon = type === 'HEALTH' ? AlertTriangle : X;
        text = 'ISSUE';
        styleClass = 'bg-rose-600/10 text-rose-400 border-rose-500/20 shadow-inner';
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Daily Rounds</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">ZLA Compliance & Field Verification</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button onClick={() => adjustDate(-1)} className="p-2 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-slate-500 hover:text-emerald-400 transition-colors"><ChevronLeft size={16} /></button>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="w-36 bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-9 pr-2 py-2 text-xs font-bold text-white focus:outline-none" />
          </div>
          <button onClick={() => adjustDate(1)} className="p-2 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-slate-500 hover:text-emerald-400 transition-colors"><ChevronRight size={16} /></button>
        </div>

        <div className="flex items-center gap-2 bg-[#0A0B0E] p-1.5 rounded-xl border border-slate-800/80">
            <button onClick={() => setRoundType('Morning')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase ${roundType === 'Morning' ? 'bg-amber-600/20 text-amber-500' : 'text-slate-500'}`}>AM</button>
            <button onClick={() => setRoundType('Evening')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase ${roundType === 'Evening' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-500'}`}>PM</button>
        </div>
        
        <button onClick={handleSignOff} className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-6 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
          <ClipboardCheck size={14} /> Submit
        </button>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide bg-[#0F1117] border border-slate-800/80 p-1.5 rounded-2xl gap-1 shadow-inner">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-1 py-2.5 px-4 text-[10px] font-black uppercase rounded-xl ${activeCategory === cat ? 'bg-emerald-600/10 text-emerald-400' : 'text-slate-500'}`}>{cat}</button>
        ))}
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
         <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase">Animal</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase">Health</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase">Water</th>
                <th className="px-4 py-4 text-center text-[10px] font-black text-slate-500 uppercase">Secure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {activeAnimals.map((animal) => (
                <tr key={animal.id} className="hover:bg-[#0A0B0E]">
                    <td className="px-6 py-4 text-xs font-bold text-white">{animal.name}</td>
                    <td className="px-4 py-3 text-center">{renderButton(animal, 'HEALTH')}</td>
                    <td className="px-4 py-3 text-center">{renderButton(animal, 'WATER')}</td>
                    <td className="px-4 py-3 text-center">{renderButton(animal, 'SECURE')}</td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>
    </div>
  );
}