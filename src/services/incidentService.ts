import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { Incident, IncidentSchema } from '../types/schema';
import { queryClient } from '../lib/db';

const generateUUID = () => crypto.randomUUID();

export const incidentService = {
  getRecentIncidents: async (): Promise<Incident[]> => {
    // Limit to 100 to prevent memory bloat, ordered by most recent
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('is_deleted', false)
      .order('incident_date', { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching incidents:", error);
      throw error;
    }
    
    return data as Incident[];
  },

  saveIncident: async (data: Partial<Incident>, userId: string): Promise<void> => {
    // 1. Strict Payload Construction & Context Binding
    const payload = IncidentSchema.parse({
      ...data,
      id: data.id || generateUUID(),
      reported_by: data.reported_by || userId,
      created_by: data.id ? data.created_by : userId,
      modified_by: userId,
      created_at: data.id ? data.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    });

    try {
      // 2. Direct Sync Attempt
      const { error } = await supabase.from('incidents').upsert(payload);
      if (error) throw error;
    } catch (error) {
      // 3. Fallback Outbox Routing
      console.warn("Network offline. Queueing Incident Log to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'incidents',
        action: 'upsert',
        payload
      });
    }
    
    // 4. Force Cache Invalidation to refresh UI
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
  }
};