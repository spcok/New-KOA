import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Settings as SettingsIcon, Users, Shield, Database, Save } from 'lucide-react';
import { User } from '../../types/schema';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('users');

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await supabase.from('users').select('*').eq('is_deleted', false);
      return data || [];
    }
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">System Settings</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Configuration & Access Control</p>
        </div>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide bg-[#0F1117] border border-slate-800/80 p-1.5 rounded-2xl gap-1 shadow-inner">
        {[
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'roles', label: 'Roles & Permissions', icon: Shield },
          { id: 'system', label: 'System Config', icon: Database },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 min-w-[150px] py-2.5 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-[#0A0B0E]'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden min-h-[400px]">
        {activeTab === 'users' && (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0A0B0E] border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {isLoading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading Users...</td></tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#0A0B0E] transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-white">{user.name || 'Unknown User'}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-400">{user.email || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {user.role || 'STAFF'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab !== 'users' && (
          <div className="p-12 text-center flex flex-col items-center">
            <SettingsIcon size={48} className="text-emerald-500 mb-4 opacity-50" />
            <p className="text-sm font-bold text-slate-400 max-w-md mx-auto">This configuration section is currently locked by the System Administrator.</p>
          </div>
        )}
      </div>
    </div>
  );
}
