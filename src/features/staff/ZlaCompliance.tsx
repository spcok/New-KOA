import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { FileBadge, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Animal } from '../../types/schema';

export default function ZlaCompliance() {
  const { data: animals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ['animals-zla'],
    queryFn: async () => {
      const { data } = await supabase.from('animals').select('*').eq('is_deleted', false);
      return data || [];
    }
  });

  const checkCompliance = (animal: Animal) => {
    const issues: string[] = [];
    if (!animal.species) issues.push('Missing Species');
    if (!animal.acquisition_date) issues.push('Missing Acquisition Date');
    if (!animal.acquisition_type) issues.push('Missing Acquisition Type');
    if (!animal.gender) issues.push('Missing Gender');
    if (!animal.red_list_status) issues.push('Missing Red List Status');

    // ID Check: Needs at least one ID if not marked as "no ID"
    if (!animal.has_no_id && !animal.microchip_id && !animal.ring_number) {
      issues.push('Missing Identification (Microchip/Ring)');
    }

    return issues;
  };

  const complianceData = animals.map(animal => ({
    animal,
    issues: checkCompliance(animal)
  }));

  const nonCompliant = complianceData.filter(d => d.issues.length > 0);
  const compliant = complianceData.filter(d => d.issues.length === 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">ZLA Compliance</h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Zoo Licensing Act 1981 - Essential Records Audit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0F1117] border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-inner">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compliant Animals</p>
            <p className="text-3xl font-black text-emerald-400 mt-1">{compliant.length}</p>
          </div>
          <CheckCircle2 size={40} className="text-emerald-500 opacity-20" />
        </div>
        <div className="bg-[#0F1117] border border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-inner">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Action Required</p>
            <p className="text-3xl font-black text-rose-400 mt-1">{nonCompliant.length}</p>
          </div>
          <AlertTriangle size={40} className="text-rose-500 opacity-20" />
        </div>
      </div>

      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 bg-[#0A0B0E]">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <FileBadge size={16} className="text-emerald-500" />
            Compliance Audit Report
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Running ZLA Audit...</div>
        ) : nonCompliant.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CheckCircle2 size={48} className="text-emerald-500 mb-4 opacity-50" />
            <h3 className="text-lg font-black text-white uppercase">Fully Compliant</h3>
            <p className="text-xs font-bold text-slate-400 mt-2">All active animals meet minimum ZLA data requirements.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0A0B0E] border-b border-slate-800/80">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/3">Animal</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Missing Essential Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {nonCompliant.map(({ animal, issues }) => (
                  <tr key={animal.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-white">{animal.name || 'Unnamed'}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{animal.species || 'Unknown Species'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {issues.map(issue => (
                          <span key={issue} className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md text-[10px] font-black uppercase tracking-wider">
                            {issue}
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
