import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/db';
import { useOutboxStore } from '../store/outboxStore';
import { DailyRoundSchema, DailyRound } from '../types/schema';

const generateUUID = () => crypto.randomUUID();

export const dailyRoundService = {
  saveRound: async (data: Partial<DailyRound>) => {
    // 1. Sanitize Payload
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    const isNew = !sanitizedData.id;
    const recordId = sanitizedData.id || generateUUID();

    // 2. Map & Enforce Schema
    const rawPayload = {
      ...sanitizedData,
      id: recordId,
      is_deleted: false,
      updated_at: new Date().toISOString(),
      ...(isNew ? { created_at: new Date().toISOString() } : {})
    };

    // 3. The ZOD Shield
    const payload = DailyRoundSchema.parse(rawPayload);

    // 4. Optimistic UI Update (RAM)
    queryClient.setQueryData(['daily_rounds'], (old: DailyRound[] | undefined) => {
      if (!old) return [payload];
      return isNew ? [...old, payload] : old.map(r => r.id === payload.id ? payload : r);
    });

    // 5. Cloud Strike & Outbox Fallback
    try {
      const { error } = await supabase.from('daily_rounds').upsert(payload);
      if (error) throw error;
      console.log('Successfully saved Daily Round to Supabase');
    } catch (error) {
      console.warn('Network offline or Postgres rejection. Failing over to local Outbox.', error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'daily_rounds',
        action: 'upsert',
        payload
      });
    }
  },

  bulkSaveRound: async (rounds: DailyRound[]) => {
    // 1. Zod Validation (Batch)
    const payload = rounds.map(r => DailyRoundSchema.parse(r));

    // 2. Optimistic Update
    queryClient.setQueryData(['daily_rounds'], (old: DailyRound[] = []) => [...old, ...payload]);

    // 3. Cloud Strike (Bulk Upsert)
    try {
      const { error } = await supabase.from('daily_rounds').upsert(payload);
      if (error) throw error;
    } catch (error) {
      // If offline, store the array in the outbox
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'daily_rounds',
        action: 'upsert',
        payload
      });
    }
  }
};
