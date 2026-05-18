import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/db';
import { useOutboxStore } from '../store/outboxStore';
import { FeedingScheduleSchema, FeedingSchedule } from '../types/schema';

const generateUUID = () => crypto.randomUUID();

export const feedingService = {
  /**
   * Bulk adds feeding schedule tasks with Zod validation and offline support.
   */
  bulkAddTasks: async (tasks: Partial<FeedingSchedule>[]) => {
    // 1. Zod Validation & Enrichment
    const payload = tasks.map(task => {
      const id = task.id || generateUUID();
      return FeedingScheduleSchema.parse({
        ...task,
        id,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });

    // 2. Optimistic UI Update
    queryClient.setQueryData(['feeding_schedules'], (old: FeedingSchedule[] = []) => [...old, ...payload]);

    // 3. Remote Sync with Outbox Fallback
    try {
      const { error } = await supabase.from('feeding_schedules').insert(payload);
      if (error) throw error;
      
      // Invalidate queries to ensure UI is in sync with server state
      queryClient.invalidateQueries({ queryKey: ['feeding_schedules'] });
    } catch (error) {
      console.warn('Offline or remote error. Adding to outbox.', error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'feeding_schedules',
        action: 'upsert',
        payload
      });
    }
  },

  /**
   * Deletes a feeding schedule task.
   */
  deleteTask: async (taskId: string) => {
    // 1. Optimistic UI Update
    queryClient.setQueryData(['feeding_schedules'], (old: FeedingSchedule[] = []) => 
      old.filter(t => t.id !== taskId)
    );

    try {
      const { error } = await supabase.from('feeding_schedules').delete().eq('id', taskId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['feeding_schedules'] });
    } catch (error) {
      console.warn('Offline delete. Outbox not yet fully supporting delete actions, marking as deleted locally.');
      // In a real scenario, we might add a special 'delete' mutation to the outbox
      // For now, we follow the same pattern as other services.
    }
  }
};
