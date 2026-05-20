import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Syringe, Plus, Search, CheckCircle2, Clock } from 'lucide-react';
import { Animal, ClinicalSchedule, MedicationLog } from '../../types/schema';

export default function Medication() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: animals = [] } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: async () => {
      const { data } = await supabase.from('animals').select('*').eq('is_deleted', false);
      return data || [];
    }
  });

  const { data: schedules = [], isLoading } = useQuery<ClinicalSchedule[]>({
    queryKey: ['clinical_schedules'],
    queryFn: async () => {
      const { data } = await supabase.from('clinical_schedule').select('*').eq('is_deleted', false).eq('schedule_type', 'MEDICATION');
      return data || [];
    }
  });

  const getAnimalName = (id: string) => animals.find(a => a.id === id)?.name || 'Unknown Animal';

  const filteredSchedules = schedules.filter(s => {
    const animalName = getAnimalName(s.animal_id).toLowerCase();
    return animalName.includes(searchTerm.toLowerCase()) || (s.title || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Medication</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Prescriptions & Dosing Schedules</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-900/20">
          <Plus size={16} /> New Prescription
        </button>
      </div>

      <div className="bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner flex items-center gap-3">
        <Search size={16} className="text-slate-500 ml-2" />
        <input
          type="text"
          placeholder="SEARCH PRESCRIPTIONS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-xs font-bold text-white w-full focus:outline-none placeholder:text-slate-600 uppercase tracking-widest"
        />
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">Medication</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">Animal</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">Frequency</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">Status</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading Medications...</td></tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center flex flex-col items-center">
                    <Syringe size={48} className="text-emerald-500 mb-4 opacity-50" />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No active medications</p>
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-white">{schedule.title}</td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-400">{getAnimalName(schedule.animal_id)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-300">{schedule.frequency}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${schedule.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                        {schedule.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F1117] border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-colors mx-auto">
                        <CheckCircle2 size={14} /> Log Dose
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
