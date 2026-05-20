import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Clock, Plus, Search, Calendar, User } from 'lucide-react';
import { Timesheet } from '../../types/schema';

export default function Timesheets() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: timesheets = [], isLoading } = useQuery<Timesheet[]>({
    queryKey: ['timesheets'],
    queryFn: async () => {
      const { data } = await supabase.from('timesheets').select('*').eq('is_deleted', false).order('shift_date', { ascending: false });
      return data || [];
    }
  });

  const filteredTimesheets = timesheets.filter(t =>
    (t.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Timesheets</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Staff Time Logging</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-900/20">
          <Plus size={16} /> Clock In
        </button>
      </div>

      <div className="bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner flex items-center gap-3">
        <Search size={16} className="text-slate-500 ml-2" />
        <input
          type="text"
          placeholder="SEARCH LOGS..."
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
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/5">User ID</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/5">Clock In</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/5">Clock Out</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading Timesheets...</td></tr>
              ) : filteredTimesheets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center flex flex-col items-center">
                    <Clock size={48} className="text-emerald-500 mb-4 opacity-50" />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No timesheet records found</p>
                  </td>
                </tr>
              ) : (
                filteredTimesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-500" />
                        <span className="text-xs font-bold text-white">{new Date(ts.shift_date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-300">{ts.user_id?.split('-')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-emerald-400">{new Date(ts.clock_in_time).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{ts.clock_out_time ? new Date(ts.clock_out_time).toLocaleTimeString() : '--:--'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${ts.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {ts.status}
                      </span>
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
