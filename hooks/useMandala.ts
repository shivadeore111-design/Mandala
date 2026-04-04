import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMandalas,
  createMandala as apiCreateMandala,
  checkIn as apiCheckIn,
  getCheckins,
  getMe,
} from '@/lib/api';
import type { Mandala, CheckIn, AppUser } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export type { Mandala, CheckIn };
export type Profile = AppUser;

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

  const remaining: QueuedCheckIn[] = [];
  for (const item of queue) {
    try {
      await apiCheckIn(item.mandalaId);
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
      const { mandalas } = await getMandalas();
      return mandalas;
    },
    enabled: !!user,
  });
}

export function useRecentCheckIns(mandalaId: string) {
  return useQuery<CheckIn[]>({
    queryKey: ['checkins', mandalaId],
    queryFn: async () => {
      const { checkins } = await getCheckins(mandalaId);
      return checkins;
    },
    enabled: !!mandalaId,
  });
}

export function useProfile() {
  const user = useAuthStore((s) => s.user);
  return useQuery<Profile>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { user: me } = await getMe();
      return me;
    },
    enabled: !!user,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateMandala() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      practice_name: string;
      practice_type: string;
      practice_description?: string;
      target_days: number;
    }) => {
      await apiCreateMandala(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mandalas'] });
    },
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mandala: { id: string }) => {
      try {
        await apiCheckIn(mandala.id);
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

export function useMandalaDetail(id: string) {
  const user = useAuthStore((s) => s.user);
  const mandalasQuery = useQuery<Mandala[]>({
    queryKey: ['mandalas', user?.id],
    queryFn: async () => {
      const { mandalas } = await getMandalas();
      return mandalas;
    },
    enabled: !!user,
  });
  const checkinsQuery = useRecentCheckIns(id);

  const mandala = mandalasQuery.data?.find((m) => m.id === id);
  const checkins = checkinsQuery.data ?? [];

  return {
    data: mandala ? { ...mandala, mandala_checkins: checkins } : undefined,
    isLoading: mandalasQuery.isLoading || checkinsQuery.isLoading,
    error: mandalasQuery.error ?? checkinsQuery.error,
  };
}
