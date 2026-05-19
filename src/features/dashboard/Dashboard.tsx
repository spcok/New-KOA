import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Heart, AlertCircle, Scale, ClipboardCheck, CheckCircle, Plus, Calendar, ArrowDownAZ, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AnimalFormModal } from '../animals/AnimalFormModal';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sortMode, setSortMode] = useState<'NAME_ASC' | 'NAME_DESC' | 'CUSTOM'>('NAME_ASC');

  // 1. Live Query Hooks fetching directly from the tables
  const { data: rawAnimals = [] } = useQuery({ 
    queryKey: ['animals'],
    queryFn: async () => {
      const { data } = await supabase.from('animals').select('*').eq('is_deleted', false);
      return data || [];
    }
  });
  
  const { data: rawTasks = [] } = useQuery({ 
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await supabase.from('tasks').select('*').eq('is_deleted', false);
      return data || [];
    }
  });

  const { data: rawLogs = [] } = useQuery({
    queryKey: ['daily_logs'],
    queryFn: async () => {
      const { data } = await supabase.from('daily_logs').select('*').eq('is_deleted', false);
      return data || [];
    }
  });

  const { data: rawSchedules = [] } = useQuery({
    queryKey: ['feeding_schedules'],
    queryFn: async () => {
      const { data } = await supabase.from('feeding_schedules').select('*').eq('is_deleted', false).eq('is_completed', false);
      return data || [];
    }
  });

  const adjustDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const setToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Helper formatting function matching the DailyLogs precision layout rules
  const formatWeight = (g: number, unitStr: string) => {
    const u = (unitStr || 'g').toLowerCase();
    if (u === 'lbs' || u === 'lb') {
      const totalOz = g / 28.349523125;
      let eighths = Math.round((totalOz - Math.floor(totalOz)) * 8);
      let oz = Math.floor(totalOz);
      if (eighths === 8) { eighths = 0; oz++; }
      let lbs = Math.floor(oz / 16);
      oz = oz % 16;
      const eStr = eighths > 0 ? ` ${eighths}/8` : '';
      return `${lbs}lb ${oz}oz${eStr}`;
    } else if (u === 'oz') {
      const totalOz = g / 28.349523125;
      let eighths = Math.round((totalOz - Math.floor(totalOz)) * 8);
      let oz = Math.floor(totalOz);
      if (eighths === 8) { eighths = 0; oz++; }
      const eStr = eighths > 0 ? ` ${eighths}/8` : '';
      return `${oz}oz${eStr}`;
    } else if (u === 'kg') {
      return `${(g / 1000).toFixed(2)}kg`;
    }
    return `${g}g`;
  };

  const activeAnimals = rawAnimals.filter((a: any) => !a.is_deleted);
  
  const sortedAnimals = [...activeAnimals].sort((a: any, b: any) => {
    if (sortMode === 'NAME_ASC') return (a.name || '').localeCompare(b.name || '');
    if (sortMode === 'NAME_DESC') return (b.name || '').localeCompare(a.name || '');
    if (sortMode === 'CUSTOM') return (a.display_order ?? 999) - (b.display_order ?? 999);
    return 0;
  });

  const tasks = rawTasks.filter((t: any) => t.status === 'PENDING' && !t.is_deleted);

  // 2. Real-time Aggregation and Dynamic Stat Population Engine
  const enhancedAnimals = sortedAnimals.map((animal: any) => {
    const animalLogs = rawLogs.filter((l: any) => l.animal_id === animal.id);
    
    const weightLog = animalLogs.find((l: any) => l.log_type === 'WEIGHT' && l.log_date.startsWith(selectedDate));
    const todays_weight = weightLog && weightLog.weight_grams ? formatWeight(weightLog.weight_grams, animal.weight_unit) : null;

    const feedLog = animalLogs.find((l: any) => l.log_type === 'FEED' && l.log_date.startsWith(selectedDate));
    const todays_feed = feedLog ? (feedLog.notes || 'Recorded') : null;

    const historicalFeeds = animalLogs.filter((l: any) => l.log_type === 'FEED').sort((a: any, b: any) => b.log_date.localeCompare(a.log_date));
    const last_feed = historicalFeeds.length > 0 ? (historicalFeeds[0].notes || 'Recorded') : null;

    const schedules = rawSchedules.filter((s: any) => s.animal_id === animal.id).sort((a: any, b: any) => a.scheduled_date.localeCompare(b.scheduled_date));
    const next_feed = schedules.length > 0 ? schedules[0].scheduled_date : null;

    return { ...animal, todays_weight, todays_feed, last_feed, next_feed };
  });

  const filteredAnimals = activeTab === 'ALL' 
    ? enhancedAnimals 
    : enhancedAnimals.filter((a: any) => (a.category || '').toUpperCase() === activeTab);

  const renderHeaders = () => {
    if (activeTab === 'OWLS' || activeTab === 'RAPTORS') {
      return (
        <>
          <th className="px-6 py-5">Name</th>
          <th className="px-6 py-5">Species</th>
          <th className="px-6 py-5">Ring Number</th>
          <th className="px-6 py-5">Today's Wgt</th>
          <th className="px-6 py-5">Last Feed</th>
          <th className="px-6 py-5">Today's Feed</th>
          <th className="px-6 py-5">Location</th>
        </>
      );
    }
    if (activeTab === 'MAMMALS') {
      return (
        <>
          <th className="px-6 py-5">Name</th>
          <th className="px-6 py-5">Species</th>
          <th className="px-6 py-5">Microchip</th>
          <th className="px-6 py-5">Today's Feed</th>
          <th className="px-6 py-5">Location</th>
        </>
      );
    }
    if (activeTab === 'EXOTICS') {
      return (
        <>
          <th className="px-6 py-5">Name</th>
          <th className="px-6 py-5">Species</th>
          <th className="px-6 py-5">Today's Feed</th>
          <th className="px-6 py-5">Next Sched. Feed</th>
          <th className="px-6 py-5">Location</th>
        </>
      );
    }
    return (
      <>
        <th className="px-6 py-5">Name</th>
        <th className="px-6 py-5">Category</th>
        <th className="px-6 py-5">Species</th>
        <th className="px-6 py-5">Location</th>
      </>
    );
  };

  const renderRowCells = (animal: any) => {
    const emptyNode = <span className="text-slate-700">--</span>;
    const nameCell = (
      <td className="px-6 py-4 text-xs font-bold">
        <Link 
          to="/animals/$id" 
          params={{ id: animal.id } as any}
          className="text-emerald-400 hover:text-emerald-300 transition-colors underline decoration-emerald-500/30 underline-offset-4"
        >
          {animal.name || 'Unnamed'}
        </Link>
      </td>
    );

    if (activeTab === 'OWLS' || activeTab === 'RAPTORS') {
      return (
        <>
          {nameCell}
          <td className="px-6 py-4 text-xs font-bold text-slate-500">{animal.species || 'Unknown'}</td>
          <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{animal.ring_number || emptyNode}</td>
          <td className="px-6 py-4 text-xs font-bold text-amber-500 truncate max-w-[120px]">{animal.todays_weight || emptyNode}</td>
          <td className="px-6 py-4 text-xs font-bold text-slate-500 truncate max-w-[150px]">{animal.last_feed || emptyNode}</td>
          <td className="px-6 py-4 text-xs font-bold text-slate-500 truncate max-w-[150px]">{animal.todays_feed || emptyNode}</td>
          <td className="px-6 py-4"><span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">{animal.location || 'Unknown'}</span></td>
        </>
      );
    }
    if (activeTab === 'MAMMALS') {
      return (
        <>
          {nameCell}
          <td className="px-6 py-4 text-xs font-bold text-slate-500">{animal.species || 'Unknown'}</td>
          <td className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{animal.microchip_id || emptyNode}</td>
          <td className="px-6 py-4 text-xs font-bold text-slate-500 truncate max-w-[180px]">{animal.todays_feed || emptyNode}</td>
          <td className="px-6 py-4"><span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">{animal.location || 'Unknown'}</span></td>
        </>
      );
    }
    if (activeTab === 'EXOTICS') {
      return (
        <>
          {nameCell}
          <td className="px-6 py-4 text-xs font-bold text-slate-500">{animal.species || 'Unknown'}</td>
          <td className="px-6 py-4 text-xs font-bold text-slate-500 truncate max-w-[180px]">{animal.todays_feed || emptyNode}</td>
          <td className="px-6 py-4 text-[10px] font-black text-amber-500/80 uppercase tracking-widest">{animal.next_feed || emptyNode}</td>
          <td className="px-6 py-4"><span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">{animal.location || 'Unknown'}</span></td>
        </>
      );
    }
    return (
      <>
        {nameCell}
        <td className="px-6 py-4 text-[10px] font-black text-blue-400 uppercase tracking-widest">{animal.category || emptyNode}</td>
        <td className="px-6 py-4 text-xs font-bold text-slate-500">{animal.species || 'Unknown'}</td>
        <td className="px-6 py-4"><span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">{animal.location || 'Unknown'}</span></td>
      </>
    );
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
            Live Local Sync <span className="text-slate-700">|</span> 🌤️ Active
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-[#0F1117] rounded-2xl border border-slate-800/80 shadow-2xl p-5 flex flex-col transition-all duration-300 h-64 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[64px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#0A0B0E] border border-slate-800/80 text-blue-500 rounded-xl shadow-inner"><ClipboardCheck size={18} /></div>
                      <h2 className="text-sm font-black text-white uppercase tracking-widest">Pending Duties</h2>
                  </div>
                  <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-lg">{tasks.length}</span>
              </div>
              <div className="mt-4 flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide relative z-10">
                  {tasks.length > 0 ? tasks.map((t: any) => (
                      <div key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#0A0B0E] border border-slate-800/80 shadow-inner">
                          <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0"/>
                          <div>
                              <p className="text-xs font-bold text-slate-200">{t.title}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Due: {t.due_date || 'N/A'}</p>
                          </div>
                      </div>
                  )) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500">
                          <CheckCircle size={24} className="text-emerald-500/50 mb-3"/>
                          <p className="text-xs font-bold uppercase tracking-widest">All duties satisfied</p>
                      </div>
                  )}
              </div>
          </div>

          <div className="bg-[#0F1117] rounded-2xl border border-slate-800/80 shadow-2xl p-5 flex flex-col transition-all duration-300 h-64 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[64px] rounded-full pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#0A0B0E] border border-slate-800/80 text-rose-500 rounded-xl shadow-inner"><Heart size={18} /></div>
                      <h2 className="text-sm font-black text-white uppercase tracking-widest">Health Rota</h2>
                  </div>
              </div>
              <div className="flex flex-col items-center justify-center h-full text-slate-500 relative z-10">
                  <Heart size={24} className="text-rose-500/30 mb-3"/>
                  <p className="text-xs font-bold uppercase tracking-widest">Collection Stable</p>
              </div>
          </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <button onClick={() => adjustDate(-1)} className="p-2 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors shadow-inner" title="Previous Day">
              <ChevronLeft size={16} />
            </button>
            <button onClick={setToday} className="px-3 py-2 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors shadow-inner">
              Today
            </button>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-36 bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-9 pr-2 py-2 text-xs font-bold text-white focus:outline-none"
              />
            </div>
            <button onClick={() => adjustDate(1)} className="p-2 bg-[#0A0B0E] border border-slate-800/80 rounded-xl text-slate-500 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors shadow-inner" title="Next Day">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="hidden sm:block w-px h-6 bg-slate-800/80" />

          <div className="relative flex-1 sm:flex-none">
            <ArrowDownAZ className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <select 
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as any)}
              className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-white focus:outline-none appearance-none"
            >
              <option value="NAME_ASC">Name (A-Z)</option>
              <option value="NAME_DESC">Name (Z-A)</option>
              <option value="CUSTOM">Custom Order</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
        >
          <Plus size={16} /> Add Animal
        </button>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide bg-[#0F1117] border border-slate-800/80 p-1.5 rounded-2xl gap-1 shadow-inner">
        {['ALL', 'OWLS', 'RAPTORS', 'MAMMALS', 'EXOTICS', 'ARCHIVED'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`flex-1 min-w-[100px] py-2.5 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
              activeTab === cat 
              ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 shadow-sm' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-[#0A0B0E]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden relative">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80 text-slate-500 font-black text-[10px] uppercase tracking-widest">
              <tr>
                {renderHeaders()}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0A0B0E] border border-slate-800/80 mb-4 shadow-inner">
                      <Scale size={24} className="text-slate-600" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">No Records Found</h3>
                    <p className="text-xs font-bold text-slate-500 mt-2">No animals match this category filter.</p>
                  </td>
                </tr>
              ) : (
                filteredAnimals.map((animal: any) => (
                  <tr key={animal.id} className="hover:bg-[#0A0B0E] transition-colors group">
                    {renderRowCells(animal)}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <AnimalFormModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
}