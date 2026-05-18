import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/db';
import { useOutboxStore } from '../store/outboxStore';
import { DailyLogSchema, DailyLog } from '../types/schema';

const generateUUID = () => crypto.randomUUID();

export const dailyLogService = {
  saveLog: async (data: Partial<DailyLog>) => {
    // 1. Sanitize Payload: Convert empty strings to null
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    const isNew = !sanitizedData.id;
    const recordId = sanitizedData.id || generateUUID();

    // 2. Iron-Clad Schema Mapping
    const rawPayload = {
      ...sanitizedData,
      id: recordId,
      is_deleted: false,
      updated_at: new Date().toISOString(),
      ...(isNew ? { created_at: new Date().toISOString() } : {})
    };

    // 3. The ZOD Shield
    const payload = DailyLogSchema.parse(rawPayload);

    // 4. Optimistic UI Update (RAM)
    queryClient.setQueryData(['daily_logs'], (old: DailyLog[] | undefined) => {
      if (!old) return [payload];
      return isNew ? [...old, payload] : old.map(l => l.id === payload.id ? payload : l);
    });

    // 5. The Cloud Strike
    try {
      const { error } = await supabase.from('daily_logs').upsert(payload);
      if (error) throw error;
      console.log('Successfully saved Daily Log to Supabase');
    } catch (error) {
      console.warn('Network offline or Postgres rejection. Failing over to local Outbox.', error);
      
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'daily_logs',
        action: 'upsert',
        payload
      });
    }
  }
};
