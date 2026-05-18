import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { FeedingSchedule } from '../types/schema';

export const feedingService = {
  // We accept userId here to ensure RLS compliance
  async bulkCreateSchedules(schedules: Omit<FeedingSchedule, 'id' | 'created_at' | 'updated_at'>[], userId: string) {
    // Ensure every single object in the array has the required user ID
    const payload = schedules.map(s => ({
      ...s,
      created_by: userId,
      modified_by: userId
    }));

    try {
      const { error } = await supabase.from('feeding_schedules').insert(payload);
      if (error) throw error;
    } catch (error) {
      console.error("Mutation failed, queueing to outbox:", error);
      // Even the outbox item must have the correct user ID
      useOutboxStore.getState().addMutation({
        id: crypto.randomUUID(),
        table: 'feeding_schedules',
        action: 'insert',
        payload: payload 
      });
    }
  },

  async deleteSchedule(id: string, userId: string) {
    try {
      const { error } = await supabase
        .from('feeding_schedules')
        .update({ is_deleted: true, modified_by: userId })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      useOutboxStore.getState().addMutation({
        id: crypto.randomUUID(),
        table: 'feeding_schedules',
        action: 'update',
        payload: { id, is_deleted: true, modified_by: userId }
      });
    }
  }
};