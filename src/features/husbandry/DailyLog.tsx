import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import AddEntryModal from './AddEntryModal';

export default function DailyLog() {
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeCategory, setActiveCategory] = useState('OWLS');
  const [hideSubAccounts, setHideSubAccounts] = useState(true);
  
  const [modalState, setModalState] = useState<{isOpen: boolean, animal: any, type: string}>({ isOpen: false, animal: null, type: 'GENERAL' });

  // 1. Sync Engine Local Cache Reads (PATCHED with queryFn)
  const { data: rawAnimals = [], isLoading: loadingAnimals } = useQuery({ 
    queryKey: ['animals'], 
    queryFn: () => [], 
    staleTime: Infinity 
  });
  
  const { data: rawLogs = [], isLoading: loadingLogs } = useQuery({ 
    queryKey: ['daily_logs'], 
    queryFn: () => [], 
    staleTime: Infinity 
  });

  const adjustDate = (days: number) => {
    const d = new Date(viewDate); d.setDate(d.getDate() + days);
    setViewDate(d.toISOString().split('T')[0]);
  };

  // 2. Highly Optimized Data Filtering
  const activeAnimals = rawAnimals
    .filter((a: any) => !a.is_deleted && (a.category || '').toUpperCase() === activeCategory)
    .filter((a: any) => hideSubAccounts ? !(a.entity_type === 'individual' && a.parent_mob_id) : true)
    .sort((a: any, b: any) => (a.display_order ?? 999) - (b.display_order ?? 999));

  const todaysLogs = rawLogs.filter((l: any) => l.log_date === viewDate && !l.is_deleted);

  // Helper to fetch a specific cell's log
  const getLog = (animalId: string, type: string) => todaysLogs.find((l: any) => l.animal_id === animalId && l.log_type === type);

  // 3. Dynamic Renderers
  const renderHeaders = () => {
    const isExotic = activeCategory === 'EXOTICS';
    return (
      <tr>
        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/3">Animal</th>
        {!isExotic && <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/6">WT</th>}
        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">FEED</th>
        {isExotic && <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/6">MIST</th>}
        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">ENV</th>
      </tr>
    );
  };

  const renderCell = (animal: any, type: string) => {
    const log = getLog(animal.id, type);
    const hasData = !!log;
    
    let displayValue = '--';
    if (hasData) {
      if (type === 'WEIGHT' && log.weight_grams) {
        const g = log.weight_grams;
        const unit = (log.weight_unit || animal.weight_unit || 'g').toLowerCase();
        
        if (unit === 'lbs' || unit === 'lb') {
          const totalOz = g / 28.349523125;
          let eighths = Math.round((totalOz - Math.floor(totalOz)) * 8);
          let oz = Math.floor(totalOz);
          if (eighths === 8) { eighths = 0; oz++; }
          let lbs = Math.floor(oz / 16);
          oz = oz % 16;
          const eStr = eighths > 0 ? ` ${eighths}/8` : '';
          displayValue = `${lbs}lb ${oz}oz${eStr}`;
        } else if (unit === 'oz') {
          const totalOz = g / 28.349523125;
          let eighths = Math.round((totalOz - Math.floor(totalOz)) * 8);
          let oz = Math.floor(totalOz);
          if (eighths === 8) { eighths = 0; oz++; }
          const eStr = eighths > 0 ? ` ${eighths}/8` : '';
          displayValue = `${oz}oz${eStr}`;
        } else if (unit === 'kg') {
          displayValue = `${(g / 1000).toFixed(2)}kg`;
        } else {
          displayValue = `${g}g`;
        }
      } else if (type === 'ENV') {
        if (log.temperature_c) displayValue = `${log.temperature_c}°C`;
        else if (log.basking_temp_c) displayValue = `${log.basking_temp_c}°C / ${log.cool_temp_c}°C`;
        else displayValue = 'Recorded';
      } else {
        displayValue = 'Recorded';
      }
    }

    return (
      <td className="px-4 py-3 text-center">
        <button 
          onClick={() => setModalState({ isOpen: true, animal, type })}
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border ${
            hasData 
              ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-inner' 
              : 'bg-[#0A0B0E] text-slate-600 border-slate-800/80 hover:bg-slate-800/50 hover:text-emerald-400 hover:border-emerald-500/50'
          }`}
        >
          {hasData ? <Check size={14} /> : <Plus size={14} className="opacity-50" />}
          {displayValue}
        </button>
      </td>
    );
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Daily Logs</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Rapid Husbandry Logging</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button onClick={() => adjustDate(-1)} className="p-2 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors shadow-inner"><ChevronLeft size={16} /></button>
          <button onClick={() => setViewDate(new Date().toISOString().split('T')[0])} className="px-3 py-2 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors shadow-inner">Today</button>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="w-full sm:w-36 bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-9 pr-2 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
          </div>
          <button onClick={() => adjustDate(1)} className="p-2 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors shadow-inner"><ChevronRight size={16} /></button>
        </div>
        
        <button onClick={() => setHideSubAccounts(!hideSubAccounts)} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${hideSubAccounts ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-inner' : 'bg-[#0A0B0E] border border-slate-800/80 text-slate-500 hover:text-white'}`}>
          <Users size={14} /> {hideSubAccounts ? 'Sub-Accounts Hidden' : 'Showing All'}
        </button>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide bg-[#0F1117] border border-slate-800/80 p-1.5 rounded-2xl gap-1 shadow-inner">
        {['OWLS', 'RAPTORS', 'MAMMALS', 'EXOTICS'].map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex-1 min-w-[100px] py-2.5 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-[#0A0B0E]'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80">
              {renderHeaders()}
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {(loadingAnimals || loadingLogs) ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Accessing Vault...</td></tr>
              ) : activeAnimals.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest">No animals in this category</td></tr>
              ) : (
                activeAnimals.map((animal: any) => (
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
                    {activeCategory !== 'EXOTICS' && renderCell(animal, 'WEIGHT')}
                    {renderCell(animal, 'FEED')}
                    {activeCategory === 'EXOTICS' && renderCell(animal, 'MISTING')}
                    {renderCell(animal, 'ENV')}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalState.isOpen && modalState.animal && (
        <AddEntryModal 
          isOpen={modalState.isOpen} 
          onClose={() => setModalState({ ...modalState, isOpen: false })} 
          animal={modalState.animal} 
          initialType={modalState.type} 
          existingLog={getLog(modalState.animal.id, modalState.type)} 
          viewDate={viewDate} 
        />
      )}
    </div>
  );
}
