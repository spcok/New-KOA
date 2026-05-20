import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { CalendarDays, Plus, Search, Calendar, User } from 'lucide-react';
import { Rota } from '../../types/schema';

export default function RotaComponent() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: rotas = [], isLoading } = useQuery<Rota[]>({
    queryKey: ['rotas'],
    queryFn: async () => {
      const { data } = await supabase.from('rotas').select('*').eq('is_deleted', false).order('shift_date', { ascending: true });
      return data || [];
    }
  });

  const filteredRotas = rotas.filter(r =>
    (r.shift_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Rota</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Staff Scheduling & Shifts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-900/20">
          <Plus size={16} /> Assign Shift
        </button>
      </div>

      <div className="bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner flex items-center gap-3">
        <Search size={16} className="text-slate-500 ml-2" />
        <input
          type="text"
          placeholder="SEARCH SHIFTS..."
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
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/5">Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">Shift</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/5">User</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/5">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading Rota...</td></tr>
              ) : filteredRotas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center flex flex-col items-center">
                    <CalendarDays size={48} className="text-emerald-500 mb-4 opacity-50" />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No shifts scheduled</p>
                  </td>
                </tr>
              ) : (
                filteredRotas.map((rota) => (
                  <tr key={rota.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-500" />
                        <span className="text-xs font-bold text-white">{new Date(rota.shift_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-800 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {rota.shift_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-300">{rota.user_id?.split('-')[0] || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">
                      {rota.start_time || '09:00'} - {rota.end_time || '17:00'}
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
