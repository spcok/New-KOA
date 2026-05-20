import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { DailyLog, DailyLogSchema } from '../types/schema';
import { queryClient } from '../lib/db';

const generateUUID = () => crypto.randomUUID();

export const dailyLogService = {
  getLogsByDate: async (dateStr: string): Promise<DailyLog[]> => {
    // Convert the YYYY-MM-DD string into strict Postgres timestamp ranges
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .gte('log_date', startOfDay)
      .lte('log_date', endOfDay)
      .eq('is_deleted', false);

    if (error) {
      console.error("Error fetching logs by date:", error);
      throw error;
    }
    
    return data as DailyLog[];
  },

  getDashboardLogs: async (dateStr: string): Promise<{ todaysLogs: DailyLog[], lastFeeds: DailyLog[] }> => {
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    // Calculate date 30 days ago to prune history and protect performance
    const dateObj = new Date(dateStr);
    dateObj.setDate(dateObj.getDate() - 30);
    const thirtyDaysAgo = dateObj.toISOString().split('T')[0] + 'T00:00:00.000Z';

    const { data: todaysLogs, error: errorLogs } = await supabase
      .from('daily_logs')
      .select('*')
      .gte('log_date', startOfDay)
      .lte('log_date', endOfDay)
      .eq('is_deleted', false);

    if (errorLogs) {
      console.error("Error fetching today's logs for dashboard:", errorLogs);
      throw errorLogs;
    }

    const { data: lastFeeds, error: errorFeeds } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('log_type', 'FEED')
      .gte('log_date', thirtyDaysAgo)
      .lte('log_date', endOfDay)
      .eq('is_deleted', false)
      .order('log_date', { ascending: false });

    if (errorFeeds) {
      console.error("Error fetching recent feed logs for dashboard:", errorFeeds);
      throw errorFeeds;
    }

    return {
      todaysLogs: todaysLogs as DailyLog[],
      lastFeeds: lastFeeds as DailyLog[]
    };
  },

  saveLog: async (data: Partial<DailyLog>, userId: string): Promise<void> => {
    const payload = DailyLogSchema.parse({
      ...data,
      id: data.id || generateUUID(),
      created_by: userId,
      modified_by: userId,
      updated_at: new Date().toISOString(),
      created_at: data.created_at || new Date().toISOString()
    });

    try {
      const { error } = await supabase.from('daily_logs').upsert(payload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing Daily Log to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'daily_logs',
        action: 'upsert',
        payload
      });
    }
    
    // Invalidate the specific date cache to trigger a UI refresh
    if (payload.log_date) {
      const logDateOnly = payload.log_date.split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['daily_logs', logDateOnly] });
    }
  }
};