import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { Task } from '../types/schema';
import { queryClient } from '../lib/db';

export const feedingService = {
  bulkAddTasks: async (tasks: Partial<Task>[]) => {
    try {
      const { error } = await supabase.from('tasks').insert(tasks);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['tasks', 'FEED'] });
    } catch (error) {
      useOutboxStore.getState().addMutation({
        id: crypto.randomUUID(),
        table: 'tasks',
        action: 'insert',
        payload: tasks
      });
      // Optimistic update for UI feel even if offline
      queryClient.invalidateQueries({ queryKey: ['tasks', 'FEED'] });
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      await supabase.from('tasks').delete().eq('id', taskId);
      queryClient.invalidateQueries({ queryKey: ['tasks', 'FEED'] });
    } catch (error) {
      useOutboxStore.getState().addMutation({
        id: crypto.randomUUID(),
        table: 'tasks',
        action: 'delete',
        payload: { id: taskId }
      });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'FEED'] });
    }
  }
};