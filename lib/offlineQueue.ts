import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkIn as apiCheckIn } from '@/lib/api';

const KEY = 'offline_checkin_queue_v1';

export type OfflineCheckinPayload = {
  mandala_id: string;
  queued_at: string;
};

export async function enqueueOfflineCheckin(mandalaId: string) {
  const existing = await loadQueue();
  existing.push({ mandala_id: mandalaId, queued_at: new Date().toISOString() });
  await AsyncStorage.setItem(KEY, JSON.stringify(existing));
}

export async function loadQueue() {
  const raw = await AsyncStorage.getItem(KEY);
  return (raw ? (JSON.parse(raw) as OfflineCheckinPayload[]) : []).sort((a, b) =>
    a.queued_at.localeCompare(b.queued_at)
  );
}

export async function processOfflineQueue() {
  const items = await loadQueue();
  if (!items.length) return 0;

  const failed: OfflineCheckinPayload[] = [];
  let synced = 0;

  for (const item of items) {
    try {
      await apiCheckIn(item.mandala_id);
      synced += 1;
    } catch {
      failed.push(item);
    }
  }

  await AsyncStorage.setItem(KEY, JSON.stringify(failed));
  return synced;
}
