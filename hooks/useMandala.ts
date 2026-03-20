import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { scheduleCheckinReminder } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { CheckInParams, CreateMandalaParams, Mandala, MandalaCheckin } from '@/types/mandala';

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function useActiveMandalas() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['mandalas', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandalas')
        .select('*, mandala_checkins(*)')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as Mandala[];
    }
  });
}

export function useMandalaDetail(id?: string) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['mandala', id],
    enabled: Boolean(user?.id && id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandalas')
        .select('*, mandala_checkins(*)')
        .eq('id', id!)
        .eq('user_id', user!.id)
        .single();

      if (error) {
        throw error;
      }

      return data as Mandala;
    }
  });
}

export function useCreateMandala() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateMandalaParams) => {
      const startDate = new Date();
      const expectedEnd = new Date(startDate);
      expectedEnd.setDate(expectedEnd.getDate() + params.target_days - 1);

      const { data, error } = await supabase
        .from('mandalas')
        .insert({
          user_id: user!.id,
          practice_name: params.practice_name,
          practice_type: params.practice_type,
          practice_description: params.practice_description ?? '',
          practice_duration_minutes: params.practice_duration_minutes ?? 0,
          target_days: params.target_days,
          start_date: isoDate(startDate),
          expected_end_date: isoDate(expectedEnd),
          reminder_enabled: params.reminder_enabled,
          reminder_time: params.reminder_time,
          is_public: params.is_public
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      if (data.reminder_enabled) {
        await scheduleCheckinReminder(data.id, data.reminder_time);
      }

      return data as Mandala;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mandalas'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      ]);
    }
  });
}

export function useCheckIn() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CheckInParams) => {
      const { data: mandala, error: mandalaError } = await supabase
        .from('mandalas')
        .select('*')
        .eq('id', params.mandalaId)
        .eq('user_id', user!.id)
        .single();

      if (mandalaError) {
        throw mandalaError;
      }

      const nextDay = mandala.completed_days + 1;
      const today = isoDate(new Date());

      const { data: checkinData, error: checkinError } = await supabase
        .from('mandala_checkins')
        .insert({
          mandala_id: params.mandalaId,
          user_id: user!.id,
          checkin_date: today,
          day_number: nextDay,
          duration_minutes: params.duration_minutes,
          quality_rating: params.quality_rating,
          notes: params.notes ?? '',
          mood_before: params.mood_before,
          mood_after: params.mood_after
        })
        .select('*')
        .single();

      if (checkinError) {
        throw checkinError;
      }

      const isComplete = nextDay >= mandala.target_days;
      const { error: updateError } = await supabase
        .from('mandalas')
        .update({
          completed_days: nextDay,
          current_streak: nextDay,
          status: isComplete ? 'completed' : 'active',
          actual_end_date: isComplete ? today : null
        })
        .eq('id', params.mandalaId)
        .eq('user_id', user!.id);

      if (updateError) {
        throw updateError;
      }

      return checkinData as MandalaCheckin;
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mandalas'] }),
        queryClient.invalidateQueries({ queryKey: ['mandala', variables.mandalaId] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      ]);
    }
  });
}
