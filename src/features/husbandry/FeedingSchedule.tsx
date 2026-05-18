import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form'; // Unified Form Logic
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { feedingService } from '../../services/feedingService';
import { zodValidator } from '@tanstack/zod-form-adapter'; // Strict validation
import { z } from 'zod';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Animal } from '../../types/schema';

// Unified Schema consistent with your DB
const feedingSchema = z.object({
  animal_id: z.string().uuid(),
  food_type: z.string().min(1),
  quantity: z.number().min(0.1),
  calci_dust: z.boolean().default(false),
});

const FeedingSchedule = () => {
  const queryClient = useQueryClient();

  const { data: animals = [], isLoading: isLoadingAnimals } = useQuery({ 
    queryKey: ['animals'], 
    queryFn: async () => {
        const { data } = await supabase.from('animals').select('*').eq('is_deleted', false);
        return (data || []) as Animal[];
    }
  });

  const form = useForm({
    defaultValues: {
      animal_id: '',
      food_type: '',
      quantity: 1,
      calci_dust: false,
    },
    onSubmit: async ({ value }) => {
      await feedingService.bulkAddTasks([{
        animal_id: value.animal_id,
        title: 'Scheduled Feed',
        task_type: 'FEED',
        description: `${value.quantity} ${value.food_type}${value.calci_dust ? ' (+ Calci Dust)' : ''}`,
        due_date: new Date().toISOString().split('T')[0]
      }]);
      queryClient.invalidateQueries({ queryKey: ['tasks', 'FEED'] });
      form.reset();
    },
  });

  return (
    <div className="bg-[#0F1117] min-h-screen p-8 text-white relative">
      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        
        <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
            <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
                <ClipboardCheck size={28} />
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tight text-white">Feeding Schedule</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Plan and track daily diets</p>
            </div>
        </div>

      {/* TanStack Form Wrapper */}
      <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} className="space-y-6 bg-[#0A0B0E] p-6 border border-slate-800/80 rounded-2xl shadow-2xl">
        <form.Field
          name="animal_id"
          validators={{
            onChange: feedingSchema.shape.animal_id,
          }}
          children={(field) => (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Animal</label>
              <select 
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="bg-[#0F1117] border border-slate-800 p-3 rounded-xl text-white w-full focus:border-emerald-500/50 outline-none transition-colors"
              >
                <option value="">Select Animal...</option>
                {animals.map((animal) => (
                  <option key={animal.id!} value={animal.id!}>{animal.name || 'Unnamed'} ({animal.species})</option>
                ))}
              </select>
              {field.state.meta.errors ? (
                <em role="alert" className="text-red-400 text-xs">{field.state.meta.errors.join(', ')}</em>
              ) : null}
            </div>
          )}
        />
        
        <form.Field
          name="food_type"
          validators={{
            onChange: feedingSchema.shape.food_type,
          }}
          children={(field) => (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Food Type / Diet</label>
              <input 
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g. Mice, Crickets, Salad..."
                className="bg-[#0F1117] border border-slate-800 p-3 rounded-xl text-white w-full focus:border-emerald-500/50 outline-none transition-colors"
                autoComplete="off"
              />
               {field.state.meta.errors ? (
                <em role="alert" className="text-red-400 text-xs">{field.state.meta.errors.join(', ')}</em>
              ) : null}
            </div>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
             <form.Field
              name="quantity"
              validators={{
                onChange: feedingSchema.shape.quantity,
              }}
              children={(field) => (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Quantity</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(parseFloat(e.target.value))}
                    className="bg-[#0F1117] border border-slate-800 p-3 rounded-xl text-white w-full focus:border-emerald-500/50 outline-none transition-colors"
                  />
                   {field.state.meta.errors ? (
                    <em role="alert" className="text-red-400 text-xs">{field.state.meta.errors.join(', ')}</em>
                  ) : null}
                </div>
              )}
            />

            <form.Field
              name="calci_dust"
              children={(field) => (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Supplements</label>
                  <label className="flex items-center gap-3 bg-[#0F1117] border border-slate-800 p-3 shrink-0 rounded-xl cursor-pointer hover:bg-slate-800/30 transition-colors">
                     <input 
                        type="checkbox"
                        checked={field.state.value}
                        onChange={(e) => field.handleChange(e.target.checked)}
                        className="w-5 h-5 accent-emerald-500 bg-slate-900 border-slate-800 rounded"
                     />
                     <span className="text-sm font-medium text-slate-300">Calci Dust</span>
                  </label>
                </div>
              )}
            />
        </div>
        
        <div className="pt-4 flex justify-end">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
                <button 
                type="submit" 
                disabled={!canSubmit}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2"
                >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
                Schedule Feed
                </button>
            )}
          />
        </div>
      </form>
      </div>
    {/* Abstract Background Elements */}
    <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
    <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-emerald-700/5 blur-[150px] rounded-full pointer-events-none" />
    </div>
  );
};

export default FeedingSchedule;