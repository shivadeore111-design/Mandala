import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

const KEY = 'offline_checkin_queue_v1';

export type OfflineCheckinPayload = {
  mandala_id: string;
  user_id: string;
  checkin_date: string;
  day_number: number;
  duration_minutes?: number;
  quality_rating?: number;
  notes?: string;
  mood_before?: string;
  mood_after?: string;
  queued_at: string;
};

export async function enqueueOfflineCheckin(payload: Omit<OfflineCheckinPayload, 'queued_at'>) {
  const existing = await loadQueue();
  existing.push({ ...payload, queued_at: new Date().toISOString() });
  await AsyncStorage.setItem(KEY, JSON.stringify(existing));
}

export async function loadQueue() {
  const raw = await AsyncStorage.getItem(KEY);
  return (raw ? (JSON.parse(raw) as OfflineCheckinPayload[]) : []).sort((a, b) => a.queued_at.localeCompare(b.queued_at));
}

export async function processOfflineQueue() {
  const items = await loadQueue();
  if (!items.length) return 0;

  const failed: OfflineCheckinPayload[] = [];
  let synced = 0;

  for (const item of items) {
    const { error } = await supabase.from('mandala_checkins').insert({
      mandala_id: item.mandala_id,
      user_id: item.user_id,
      checkin_date: item.checkin_date,
      day_number: item.day_number,
      duration_minutes: item.duration_minutes,
      quality_rating: item.quality_rating,
      notes: item.notes ?? '',
      mood_before: item.mood_before,
      mood_after: item.mood_after
    });

    if (error) failed.push(item);
    else synced += 1;
  }

  await AsyncStorage.setItem(KEY, JSON.stringify(failed));
  return synced;
}
