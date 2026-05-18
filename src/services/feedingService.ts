import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { FeedingSchedule } from '../types/schema';

export const feedingService = {
  bulkCreateSchedules: async (schedules: Omit<FeedingSchedule, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const { error } = await supabase.from('feeding_schedules').insert(schedules);
      if (error) throw error;
    } catch (error) {
      console.warn("Network blip detected. Queueing feeding schedules to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: crypto.randomUUID(),
        table: 'feeding_schedules',
        action: 'insert',
        payload: schedules
      });
    }
  },

  deleteSchedule: async (id: string) => {
    try {
      // Soft delete as per schema definition
      const { error } = await supabase.from('feeding_schedules').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    } catch (error) {
      useOutboxStore.getState().addMutation({
        id: crypto.randomUUID(),
        table: 'feeding_schedules',
        action: 'update',
        payload: { id, is_deleted: true }
      });
    }
  }
};