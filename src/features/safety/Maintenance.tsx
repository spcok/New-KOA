import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Wrench, Plus, Search, Tag } from 'lucide-react';
import { MaintenanceTicket } from '../../types/schema';

export default function Maintenance() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: tickets = [], isLoading } = useQuery<MaintenanceTicket[]>({
    queryKey: ['maintenance_tickets'],
    queryFn: async () => {
      const { data } = await supabase.from('maintenance_tickets').select('*').eq('is_deleted', false).order('created_at', { ascending: false });
      return data || [];
    }
  });

  const filteredTickets = tickets.filter(t =>
    (t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Maintenance</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Facility Work Orders</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-900/20">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      <div className="bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner flex items-center gap-3">
        <Search size={16} className="text-slate-500 ml-2" />
        <input
          type="text"
          placeholder="SEARCH TICKETS..."
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
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">Title</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">Location</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/5">Priority</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/5">Status</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-16">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading Tickets...</td></tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center flex flex-col items-center">
                    <Wrench size={48} className="text-emerald-500 mb-4 opacity-50" />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No maintenance tickets found</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-white">{ticket.title}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-300">{ticket.location}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        ticket.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        ticket.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        ticket.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                        <Tag size={16} />
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
