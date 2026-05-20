import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Plus, X, Search, ShieldAlert, Activity, FileWarning, Save, Loader2 } from 'lucide-react';
import { incidentService } from '../../services/incidentService';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Incident, Animal } from '../../types/schema';

export default function Incidents() {
  const user = useAuthStore((s) => s.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Strict Isolated Queries
  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: () => incidentService.getRecentIncidents(),
  });

  const { data: animals = [] } = useQuery<Animal[]>({
    queryKey: ['animals_basic'],
    queryFn: async () => {
      const { data } = await supabase.from('animals').select('id, name, species').eq('is_deleted', false);
      return data || [];
    }
  });

  // 2. Client-Side Filtering
  const filteredIncidents = incidents.filter(inc => 
    (inc.person_involved_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inc.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto font-sans pb-12">
      
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <ShieldAlert className="text-rose-500" size={32} />
            Incidents Log
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">RIDDOR & Facility Injury Tracking</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0F1117] border border-slate-800/80 p-3 rounded-2xl shadow-inner">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search by name or location..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-rose-500/50" 
          />
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(225,29,72,0.15)]"
        >
          <Plus size={16} /> Log Incident
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-[#0F1117] rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden relative">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0A0B0E] border-b border-slate-800/80 text-slate-500 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Involved Party</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">Severity</th>
                <th className="px-6 py-5">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading Logs...</td></tr>
              ) : filteredIncidents.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-xs font-black text-slate-500 uppercase tracking-widest">No matching incidents found</td></tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#0A0B0E] transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-white whitespace-nowrap">
                      {new Date(inc.incident_date).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-white">{inc.person_involved_name}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{inc.person_type}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">{inc.location}</td>
                    <td className="px-6 py-4">
                      {inc.is_riddor_reportable ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                          <AlertTriangle size={12} /> RIDDOR Reportable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                          Internal Log
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{inc.outcome}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <IncidentModal 
          onClose={() => setIsModalOpen(false)} 
          userId={user?.id}
          animals={animals}
        />
      )}
    </div>
  );
}

// ==========================================
// FORM MODAL COMPONENT (Strict Null Law Enforced)
// ==========================================
function IncidentModal({ onClose, userId, animals }: { onClose: () => void, userId?: string, animals: Animal[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [incidentDate, setIncidentDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [personName, setPersonName] = useState('');
  const [personType, setPersonType] = useState('STAFF');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [injuryDetails, setInjuryDetails] = useState('');
  const [treatment, setTreatment] = useState('');
  const [outcome, setOutcome] = useState('PENDING');
  const [isRiddor, setIsRiddor] = useState(false);
  const [animalInvolved, setAnimalInvolved] = useState(false);
  const [linkedAnimalId, setLinkedAnimalId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setIsSubmitting(true);
    try {
      // STRICT NULL LAW: Empty strings must be converted to explicit nulls
      await incidentService.saveIncident({
        incident_date: new Date(incidentDate).toISOString(),
        person_involved_name: personName,
        person_type: personType,
        location: location,
        incident_description: description || null,
        injury_details: injuryDetails || null,
        treatment_provided: treatment || null,
        outcome: outcome,
        is_riddor_reportable: isRiddor,
        animal_involved: animalInvolved,
        linked_animal_id: (animalInvolved && linkedAnimalId) ? linkedAnimalId : null,
      }, userId);
      onClose();
    } catch (err) {
      console.error("Failed to save incident", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-[#0F1117] border border-slate-800/80 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        <div className="bg-[#0F1117]/90 backdrop-blur border-b border-slate-800/80 p-5 flex justify-between items-center z-20 shrink-0">
          <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <FileWarning size={18} className="text-rose-500" /> New Incident Report
          </h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"><X size={20} /></button>
        </div>

        <form id="incident-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & Time</label>
              <input type="datetime-local" required value={incidentDate} onChange={e => setIncidentDate(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 [&::-webkit-calendar-picker-indicator]:invert" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location of Incident</label>
              <input type="text" required value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Involved Person Name</label>
              <input type="text" required value={personName} onChange={e => setPersonName(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Person Type</label>
              <select value={personType} onChange={e => setPersonType(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 appearance-none">
                <option value="STAFF">Staff Member</option>
                <option value="VISITOR">Visitor</option>
                <option value="CONTRACTOR">Contractor</option>
              </select>
            </div>
          </div>

          <div className="bg-[#0A0B0E] border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-inner">
             <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={animalInvolved} onChange={e => setAnimalInvolved(e.target.checked)} className="w-5 h-5 rounded bg-[#0F1117] border-slate-800/80 text-rose-500 focus:ring-rose-500" />
                  <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Animal Involved</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isRiddor} onChange={e => setIsRiddor(e.target.checked)} className="w-5 h-5 rounded bg-[#0F1117] border-slate-800/80 text-rose-500 focus:ring-rose-500" />
                  <span className="text-xs font-black text-rose-400 uppercase tracking-widest">RIDDOR Reportable</span>
                </label>
             </div>

             {animalInvolved && (
                <div className="pt-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Select Linked Animal</label>
                  <select value={linkedAnimalId} onChange={e => setLinkedAnimalId(e.target.value)} className="w-full md:w-1/2 bg-[#0F1117] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 appearance-none">
                    <option value="">-- Select Animal --</option>
                    {animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}
                  </select>
                </div>
             )}
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Description of Incident</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 resize-none" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Injury Details (If Any)</label>
                <textarea value={injuryDetails} onChange={e => setInjuryDetails(e.target.value)} rows={3} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Treatment Provided</label>
                <textarea value={treatment} onChange={e => setTreatment(e.target.value)} rows={3} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 resize-none" />
              </div>
            </div>

            <div className="space-y-1.5 md:w-1/3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Outcome</label>
              <select value={outcome} onChange={e => setOutcome(e.target.value)} className="w-full bg-[#0A0B0E] border border-slate-800/80 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-rose-500/50 appearance-none">
                <option value="PENDING">Pending Review</option>
                <option value="RESOLVED">Resolved (First Aid Only)</option>
                <option value="HOSPITALIZED">Hospitalized</option>
                <option value="MONITORING">Ongoing Monitoring</option>
              </select>
            </div>
          </div>

        </form>
        
        <div className="p-5 border-t border-slate-800/80 bg-[#0F1117]/90 backdrop-blur shrink-0 flex justify-end z-20">
          <button type="submit" form="incident-form" disabled={isSubmitting} className="px-8 py-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.15)]">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Submit Official Record
          </button>
        </div>
      </div>
    </div>
  );
}