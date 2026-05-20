import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { FileWarning, CalendarX2 } from 'lucide-react';
import { Animal, DailyLog } from '../../types/schema';

export default function MissingRecords() {
  // Check for missing records today
  const todayDate = new Date().toISOString().split('T')[0];

  const { data: animals = [], isLoading: loadingAnimals } = useQuery<Animal[]>({
    queryKey: ['animals-active'],
    queryFn: async () => {
      const { data } = await supabase.from('animals').select('*').eq('is_deleted', false);
      return data || [];
    }
  });

  const { data: todaysLogs = [], isLoading: loadingLogs } = useQuery<DailyLog[]>({
    queryKey: ['daily_logs', todayDate],
    queryFn: async () => {
      const { data } = await supabase.from('daily_logs').select('*').eq('log_date', todayDate).eq('is_deleted', false);
      return data || [];
    }
  });

  const isLoading = loadingAnimals || loadingLogs;

  const missingData = animals.map(animal => {
    const animalLogs = todaysLogs.filter(l => l.animal_id === animal.id);
    const hasFeed = animalLogs.some(l => l.log_type === 'FEED');
    const hasEnv = animalLogs.some(l => l.log_type === 'ENV');

    const missing: string[] = [];
    if (!hasFeed) missing.push('Feeding Log');
    if (!hasEnv) missing.push('Environmental Log');

    return { animal, missing };
  }).filter(d => d.missing.length > 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Missing Records</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Daily Husbandry Log Audit</p>
        </div>
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 bg-[#0A0B0E] flex justify-between items-center">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <FileWarning size={16} className="text-amber-500" />
            Missing Logs for Today ({todayDate})
          </h2>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
            {missingData.length} Animals Flagged
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Scanning Daily Logs...</div>
        ) : missingData.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CalendarX2 size={48} className="text-emerald-500 mb-4 opacity-50" />
            <h3 className="text-lg font-black text-white uppercase">All Up To Date</h3>
            <p className="text-xs font-bold text-slate-400 mt-2">All daily husbandry logs have been completed for today.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0A0B0E] border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/3">Animal</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Missing Requirements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {missingData.map(({ animal, missing }) => (
                  <tr key={animal.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-white">{animal.name || 'Unnamed'}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{animal.species || 'Unknown Species'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {missing.map(item => (
                          <span key={item} className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-black uppercase tracking-wider">
                            {item}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
