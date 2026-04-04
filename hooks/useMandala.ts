import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Mandala {
  id: string;
  user_id: string;
  practice_name: string;
  practice_type: string;
  practice_description: string;
  practice_duration_minutes: number;
  target_days: number;
  start_date: string;
  expected_end_date: string;
  actual_end_date: string | null;
  status: 'active' | 'completed' | 'broken' | 'paused';
  completed_days: number;
  current_streak: number;
  broken_at: string | null;
  broken_reason: string;
  reminder_enabled: boolean;
  reminder_time: string;
  is_public: boolean;
  last_checkin_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckIn {
  id: string;
  mandala_id: string;
  user_id: string;
  checkin_date: string;
  day_number: number;
  duration_minutes: number;
  quality_rating: number | null;
  notes: string | null;
  mood_before: string | null;
  mood_after: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  total_mandalas_completed: number;
  total_practice_days: number;
  current_streak: number;
  longest_streak: number;
  push_token: string | null;
  created_at: string;
}

const OFFLINE_QUEUE_KEY = 'mandala_offline_queue';

// ─── Offline queue ────────────────────────────────────────────────────────────

interface QueuedCheckIn {
  mandalaId: string;
  timestamp: string;
}

async function enqueueOfflineCheckIn(mandalaId: string) {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  const queue: QueuedCheckIn[] = raw ? JSON.parse(raw) : [];
  queue.push({ mandalaId, timestamp: new Date().toISOString() });
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function flushOfflineQueue() {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) return;
  const queue: QueuedCheckIn[] = JSON.parse(raw);
  if (queue.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const remaining: QueuedCheckIn[] = [];

  for (const item of queue) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: mandala } = await supabase
        .from('mandalas')
        .select('completed_days')
        .eq('id', item.mandalaId)
        .single();

      const { error } = await supabase.from('mandala_checkins').insert({
        mandala_id: item.mandalaId,
        user_id: user.id,
        checkin_date: today,
        day_number: (mandala?.completed_days ?? 0) + 1,
      });

      if (!error) {
        await supabase.rpc('increment_streak', { p_mandala_id: item.mandalaId });
      } else {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useMandalas() {
  const user = useAuthStore((s) => s.user);
  return useQuery<Mandala[]>({
    queryKey: ['mandalas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandalas')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Mandala[];
    },
    enabled: !!user,
  });
}

export function useRecentCheckIns(mandalaId: string) {
  return useQuery<CheckIn[]>({
    queryKey: ['checkins', mandalaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandala_checkins')
        .select('*')
        .eq('mandala_id', mandalaId)
        .order('checkin_date', { ascending: false })
        .limit(40);
      if (error) throw error;
      return data as CheckIn[];
    },
    enabled: !!mandalaId,
  });
}

export function useProfile() {
  const user = useAuthStore((s) => s.user);
  return useQuery<Profile>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateMandala() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (params: {
      practice_name: string;
      practice_type: string;
      practice_description?: string;
      target_days: number;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      const end = new Date();
      end.setDate(end.getDate() + params.target_days);
      const { error } = await supabase.from('mandalas').insert({
        user_id: user!.id,
        practice_name: params.practice_name,
        practice_type: params.practice_type,
        practice_description: params.practice_description ?? '',
        target_days: params.target_days,
        start_date: today,
        expected_end_date: end.toISOString().split('T')[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandalas'] });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (mandala: Mandala) => {
      const today = new Date().toISOString().split('T')[0];
      try {
        const { error } = await supabase.from('mandala_checkins').insert({
          mandala_id: mandala.id,
          user_id: user!.id,
          checkin_date: today,
          day_number: mandala.completed_days + 1,
        });
        if (error) throw error;
        await supabase.rpc('increment_streak', { p_mandala_id: mandala.id });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
          await enqueueOfflineCheckIn(mandala.id);
        } else {
          throw err;
        }
      }
    },
    onSuccess: (_data, mandala) => {
      queryClient.invalidateQueries({ queryKey: ['mandalas'] });
      queryClient.invalidateQueries({ queryKey: ['checkins', mandala.id] });
    },
  });
}
