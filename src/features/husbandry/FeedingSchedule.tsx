import React, { useState, useMemo, useTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Plus, Calendar, Trash2, Filter, Utensils, RefreshCw, Loader2, History, ArrowRight, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Animal, type FeedingSchedule as FeedingScheduleType } from '../../types/schema';
import { feedingService } from '../../services/feedingService';

// Helper to replace legacy temporalService
const getUKLocalDate = () => new Date().toISOString().split('T')[0];

const categories = ['OWLS', 'RAPTORS', 'MAMMALS', 'EXOTICS'];

export default function FeedingSchedule() {
  const queryClient = useQueryClient();
  const [viewDate, setViewDate] = useState(getUKLocalDate());
  
  // 1. Modernized Data Fetching (Replaces Legacy Hooks)
  const { data: animals = [], isLoading: animalsLoading } = useQuery({ 
    queryKey: ['animals'], 
    queryFn: async () => {
        const { data } = await supabase.from('animals').select('*').eq('is_deleted', false);
        return data as Animal[];
    }
  });

  const { data: schedules = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['feeding_schedules'],
    queryFn: async () => {
        const { data } = await supabase.from('feeding_schedules').select('*').eq('is_deleted', false);
        return data as FeedingScheduleType[] || [];
    }
  });

  const isLoading = animalsLoading || tasksLoading;

  // Temporary mock for operational lists until settings module is wired
  const foodOptions = [{ id: '1', value: 'Mice' }, { id: '2', value: 'Day Old Chicks' }, { id: '3', value: 'Quail' }, { id: '4', value: 'Insects' }, { id: '5', value: 'Fruit/Veg' }];

  // State
  const [selectedCategory, setSelectedCategory] = useState<string>('EXOTICS');
  const [selectedAnimalId, setSelectedAnimalId] = useState('');
  const [foodType, setFoodType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [withCalciDust, setWithCalciDust] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'manual' | 'interval'>('manual');
  
  const [isPending, startTransition] = useTransition();
  const [viewFilterAnimalId, setViewFilterAnimalId] = useState<string>('ALL');
  const [viewScope, setViewScope] = useState<'upcoming' | 'history'>('upcoming');
  const [viewLayout, setViewLayout] = useState<'timeline' | 'animal'>('timeline');

  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [intervalDays, setIntervalDays] = useState(3);
  const [intervalStart, setIntervalStart] = useState(getUKLocalDate());
  const [occurrences, setOccurrences] = useState(5);

  const filteredAnimals = animals.filter(a => (a.category || '').toUpperCase() === selectedCategory);

  const toggleDate = (date: string) => {
      setSelectedDates(prev => prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]);
  };

  // Modernized Mutation Placeholder (To be wired to feedingService in next phase)
  const handleGenerate = async () => {
      if (!selectedAnimalId || !foodType || !quantity) return;
      
      const animal = animals.find(a => a.id === selectedAnimalId);
      if (!animal) return;

      let datesToSchedule: string[] = [];

      if (scheduleMode === 'manual') {
          datesToSchedule = selectedDates;
      } else {
          const [y, m, d] = intervalStart.split('-').map(Number);
          const startDate = new Date(y, m - 1, d);

          for (let i = 0; i < occurrences; i++) {
              const current = new Date(startDate);
              current.setDate(startDate.getDate() + (i * intervalDays));
              const year = current.getFullYear();
              const month = String(current.getMonth() + 1).padStart(2, '0');
              const day = String(current.getDate()).padStart(2, '0');
              datesToSchedule.push(`${year}-${month}-${day}`);
          }
      }

      const notes = `${quantity} ${foodType}${withCalciDust ? ' + Calci-dust' : ''}`;
      
      const newEntries: Partial<FeedingScheduleType>[] = datesToSchedule.map(date => ({
          animal_id: selectedAnimalId,
          scheduled_date: date,
          food_type: foodType,
          quantity: parseFloat(quantity),
          calci_dust: withCalciDust,
          additional_notes: notes,
          is_completed: false,
      }));

      try {
          await feedingService.bulkAddTasks(newEntries);
          setSelectedDates([]);
          // alert is avoided as per guidelines, but keeping user logic if necessary. 
          // For now, the service handles invalidation.
      } catch (error) {
          console.error("Failed to schedule tasks", error);
      }
  };

  const handleQuickExtend = (animalId: string) => {
      const animalTasks = schedules.filter(t => (t.animal_id === animalId));
      if (animalTasks.length === 0) return;
      
      animalTasks.sort((a, b) => (b.scheduled_date!).localeCompare(a.scheduled_date!));
      const lastTask = animalTasks[0];
      
      setSelectedCategory((animals.find(a => a.id === animalId)?.category || 'EXOTICS').toUpperCase());
      setSelectedAnimalId(animalId);
      
      if (lastTask.additional_notes) {
          const match = lastTask.additional_notes.match(/^(\d+(\.\d+)?) (.+?)( \+ Calci-dust)?$/);
          if (match) {
              setQuantity(match[1]);
              setFoodType(match[3].trim());
              setWithCalciDust(!!match[4]);
          } else {
              setQuantity(lastTask.quantity?.toString() || '1');
              setFoodType(lastTask.food_type || '');
              setWithCalciDust(!!lastTask.calci_dust);
          }
      }

      const lastDate = new Date(lastTask.scheduled_date);
      lastDate.setDate(lastDate.getDate() + 1); 
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const startDate = lastDate > new Date() ? lastDate : tomorrow;
      setIntervalStart(startDate.toISOString().split('T')[0]);
      setScheduleMode('interval');
  };

  const handleDelete = async (taskId: string) => {
      await feedingService.deleteTask(taskId);
  };

  const filteredTasks = useMemo(() => {
    return schedules
        .filter(t => viewScope === 'upcoming' ? !t.is_completed : t.is_completed)
        .filter(t => viewFilterAnimalId === 'ALL' || (t.animal_id === viewFilterAnimalId))
        .sort((a, b) => (a.scheduled_date!).localeCompare(b.scheduled_date!));
  }, [schedules, viewFilterAnimalId, viewScope]);

  const animalGroups = useMemo(() => {
      const groups = new Map<string, { animal: Animal, tasks: any[] }>();
      filteredTasks.forEach(task => {
          const aId = task.animal_id;
          if (!aId) return;
          if (!groups.has(aId)) {
              const animal = animals.find(a => a.id === aId);
              if (animal) groups.set(aId, { animal, tasks: [] });
          }
          groups.get(aId)?.tasks.push(task);
      });
      return Array.from(groups.values());
  }, [filteredTasks, animals]);

  const calendarDays = useMemo(() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days = [];
      for(let i=1; i<=daysInMonth; i++) {
          const d = new Date(year, month, i);
          days.push(d.toISOString().split('T')[0]);
      }
      return days;
  }, []);

  const inputClass = "w-full px-4 py-2.5 bg-[#0F1117] border border-slate-800/80 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner";

  if (isLoading) return <div className="p-8 flex justify-center items-center min-h-screen"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;

  return (
    <div className="space-y-6 bg-[#0F1117] min-h-screen text-slate-300 font-sans p-4 lg:p-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-[1600px] mx-auto">
             <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    <CalendarClock className="text-emerald-500" size={28} /> Feeding Schedule
                </h1>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Plan and view future feeding tasks</p>
             </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
            
            {/* LEFT COLUMN: CREATION */}
            <div className="xl:col-span-1 space-y-4">
                 <div className="bg-[#0A0B0E] p-6 rounded-2xl border border-slate-800/80 shadow-2xl">
                     <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-800/80 pb-4">
                        <Plus size={16} className="text-emerald-500"/> Schedule Feeds
                     </h4>
                     
                     <div className="space-y-5">
                        <div className="bg-[#0F1117] p-1.5 rounded-xl flex border border-slate-800/80 overflow-x-auto scrollbar-hide shadow-inner">
                            {categories.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`flex-1 min-w-[70px] py-2 px-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selectedCategory === cat ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Animal *</label>
                            <select value={selectedAnimalId} onChange={e => setSelectedAnimalId(e.target.value)} className={inputClass}>
                                <option value="">Select Animal...</option>
                                {filteredAnimals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Food Type *</label>
                                <select value={foodType} onChange={e => setFoodType(e.target.value)} className={inputClass} required>
                                    <option value="" disabled>Select food type...</option>
                                    {foodOptions.map(f => <option key={f.id} value={f.value}>{f.value}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Quantity *</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClass} placeholder="1"/>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-[#0F1117] p-3 rounded-xl border border-slate-800/80 shadow-inner">
                            <input type="checkbox" id="calci" checked={withCalciDust} onChange={e => setWithCalciDust(e.target.checked)} className="w-4 h-4 text-emerald-500 bg-[#0A0B0E] rounded border-slate-700 focus:ring-emerald-500/50 focus:ring-offset-[#0F1117]"/>
                            <label htmlFor="calci" className="text-xs font-bold text-slate-300 select-none cursor-pointer uppercase tracking-widest">Include Calci-dust</label>
                        </div>

                        <div className="pt-5 border-t border-slate-800/80">
                             <div className="flex flex-col gap-2 mb-4">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Schedule Method *</label>
                                <div className="flex items-center gap-3 bg-[#0F1117] p-3 rounded-xl border border-slate-800/80 shadow-inner">
                                    <input 
                                        type="checkbox" 
                                        id="intervalMode" 
                                        checked={scheduleMode === 'interval'} 
                                        onChange={(e) => setScheduleMode(e.target.checked ? 'interval' : 'manual')}
                                        className="w-4 h-4 text-emerald-500 bg-[#0A0B0E] rounded border-slate-700 focus:ring-emerald-500/50 focus:ring-offset-[#0F1117]"
                                    />
                                    <label htmlFor="intervalMode" className="text-xs font-bold text-slate-300 select-none cursor-pointer uppercase tracking-widest">Auto-Interval Mode</label>
                                </div>
                             </div>

                             {scheduleMode === 'manual' ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-2">
                                         <span className="text-xs font-black text-white uppercase tracking-widest">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1 bg-[#0F1117] p-3 rounded-xl border border-slate-800/80 shadow-inner">
                                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                                            <div key={d} className="text-center text-[10px] text-slate-500 font-black uppercase py-1">{d}</div>
                                        ))}
                                        {calendarDays.map(date => {
                                            const [y, m, d] = date.split('-').map(Number);
                                            const localDate = new Date(y, m-1, d);
                                            const dayNum = localDate.getDate();
                                            const colStart = localDate.getDay() + 1;
                                            const isSelected = selectedDates.includes(date);
                                            
                                            const style = dayNum === 1 ? { gridColumnStart: colStart } : {};

                                            return (
                                                <button 
                                                    key={date}
                                                    style={style}
                                                    onClick={() => toggleDate(date)}
                                                    className={`h-8 w-8 mx-auto rounded-xl text-[10px] font-black transition-all flex items-center justify-center ${
                                                        isSelected ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-[#0A0B0E] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                                                    }`}
                                                >
                                                    {dayNum}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="text-[10px] font-bold text-emerald-500 text-right uppercase tracking-widest">{selectedDates.length} dates selected</p>
                                </div>
                             ) : (
                                <div className="space-y-4 bg-[#0F1117] p-4 rounded-xl border border-slate-800/80 shadow-inner animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-start gap-3 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                                        <RefreshCw size={16} className="text-emerald-500 shrink-0"/>
                                        <div className="text-[10px] text-emerald-400/90 font-bold uppercase tracking-widest leading-relaxed">
                                            Generate repeating tasks starting from a date.
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
                                        <input type="date" value={intervalStart} onChange={e => setIntervalStart(e.target.value)} className={inputClass}/>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Repeat Every (Days)</label>
                                            <input type="number" min="1" value={intervalDays} onChange={e => setIntervalDays(parseInt(e.target.value))} className={inputClass}/>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Occurrences</label>
                                            <input type="number" min="1" max="50" value={occurrences} onChange={e => setOccurrences(parseInt(e.target.value))} className={inputClass}/>
                                        </div>
                                    </div>
                                </div>
                             )}
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={!selectedAnimalId || !foodType || !quantity || (scheduleMode === 'manual' && selectedDates.length === 0)}
                            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2 mt-4"
                        >
                            <CalendarClock size={16} /> CONFIRM SCHEDULE
                        </button>
                     </div>
                 </div>
            </div>

            {/* RIGHT COLUMN: VIEWING */}
            <div className="xl:col-span-2 space-y-4">
                <div className="bg-[#0A0B0E] p-6 rounded-2xl border border-slate-800/80 shadow-2xl h-full flex flex-col">
                    <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-5 mb-5">
                         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                             <div>
                                <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Utensils size={16} className="text-emerald-500"/> Scheduled Feeds
                                </h4>
                                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">{filteredTasks.length} {viewScope} feeds found</p>
                             </div>
                             
                             <div className="flex flex-wrap items-center gap-3">
                                 {/* Scope Toggle */}
                                 <div className="bg-[#0F1117] p-1.5 rounded-xl flex border border-slate-800/80 shadow-inner">
                                     <button onClick={() => setViewScope('upcoming')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewScope === 'upcoming' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}>Upcoming</button>
                                     <button onClick={() => setViewScope('history')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${viewScope === 'history' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}><History size={12}/> History</button>
                                 </div>

                                 {/* Layout Toggle */}
                                 <div className="bg-[#0F1117] p-1.5 rounded-xl flex border border-slate-800/80 shadow-inner hidden sm:flex">
                                     <button onClick={() => setViewLayout('timeline')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewLayout === 'timeline' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}>Timeline</button>
                                     <button onClick={() => setViewLayout('animal')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewLayout === 'animal' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}>By Animal</button>
                                 </div>
                             </div>
                         </div>

                         {/* Filter */}
                         <div className="flex items-center gap-3 bg-[#0F1117] p-2.5 rounded-xl border border-slate-800/80 w-full shadow-inner">
                             <Filter size={16} className="text-slate-500 ml-2" />
                             <select 
                                value={viewFilterAnimalId} 
                                onChange={(e) => setViewFilterAnimalId(e.target.value)}
                                className="bg-transparent text-xs font-black text-white uppercase tracking-widest border-none focus:ring-0 cursor-pointer w-full outline-none"
                             >
                                 <option value="ALL">All Animals Filter</option>
                                 {animals.filter(a => !a.archived).map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                             </select>
                         </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[400px]">
                        {filteredTasks.length > 0 ? (
                            viewLayout === 'timeline' ? (
                                <div className="space-y-3">
                                    {filteredTasks.map(task => {
                                        const animal = animals.find(a => a.id === (task.animal_id));
                                        if (!animal) return null;
                                        
                                        const dateObj = new Date(task.due_date);
                                        const isToday = (task.due_date) === getUKLocalDate();

                                        return (
                                            <div key={task.id} className={`flex items-center bg-[#0F1117] border border-slate-800/80 rounded-xl p-3 hover:border-slate-600 transition-all group shadow-sm ${task.completed ? 'opacity-40 grayscale' : ''}`}>
                                                <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center mr-4 border ${isToday ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#0A0B0E] border-slate-800 text-slate-400'}`}>
                                                    <span className="text-[9px] uppercase font-black tracking-widest">{dateObj.toLocaleString('default', {month: 'short'})}</span>
                                                    <span className="text-sm font-black leading-none my-0.5">{dateObj.getDate()}</span>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">{animal.name}</h3>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-[#0A0B0E] border border-slate-800 px-2 py-0.5 rounded-md">{animal.category}</span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate">{task.additional_notes || `${task.quantity} ${task.food_type}`}</p>
                                                </div>

                                                <button 
                                                    onClick={() => handleDelete(task.id!)}
                                                    className="p-2.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ml-2"
                                                    title="Delete Schedule Item"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {animalGroups.map(({ animal, tasks }) => (
                                        <div key={animal.id} className="bg-[#0F1117] border border-slate-800/80 rounded-xl p-4 hover:border-emerald-500/30 transition-all shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-[#0A0B0E] border border-slate-800 text-slate-400 flex items-center justify-center font-black text-sm uppercase">
                                                        {animal.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-black text-white uppercase tracking-tight">{animal.name}</h3>
                                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{tasks.length} {viewScope} entries</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleQuickExtend(animal.id)}
                                                    className="bg-[#0A0B0E] border border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                                                    title="Extend Schedule"
                                                >
                                                    <Copy size={12}/> Extend
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="bg-[#0A0B0E] p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between shadow-inner">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Range</span>
                                                    <div className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-widest">
                                                        {new Date(tasks[0].scheduled_date as string).toLocaleDateString()} 
                                                        <ArrowRight size={10} className="text-slate-600"/> 
                                                        {new Date(tasks[tasks.length - 1].scheduled_date as string).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <div className="bg-[#0A0B0E] p-2.5 rounded-lg border border-slate-800/80 shadow-inner">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Diet Info</span>
                                                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest truncate" title={tasks[0].additional_notes}>{tasks[0].additional_notes || 'See details'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-600">
                                <Calendar size={40} className="mb-4 opacity-20" />
                                <p className="text-sm font-black uppercase tracking-widest text-slate-400">No {viewScope} feeds found</p>
                                <p className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-widest">Use the creation tool to add new feeds</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};