import { supabase } from '@/lib/supabase';

export const BADGES = [
  { id: 'first_checkin', name: 'First Flame', rarity: 'common', test: (p: ProfileStats) => p.total_checkins >= 1 },
  { id: 'streak_7', name: '7 Day Streak', rarity: 'common', test: (p: ProfileStats) => p.current_streak >= 7 },
  { id: 'streak_21', name: '21 Day Streak', rarity: 'rare', test: (p: ProfileStats) => p.current_streak >= 21 },
  { id: 'streak_40', name: '40 Day Streak', rarity: 'legendary', test: (p: ProfileStats) => p.current_streak >= 40 },
  { id: 'mandala_1', name: 'First Mandala', rarity: 'common', test: (p: ProfileStats) => p.total_mandalas_completed >= 1 },
  { id: 'mandala_3', name: 'Three Mandalas', rarity: 'rare', test: (p: ProfileStats) => p.total_mandalas_completed >= 3 },
  { id: 'mandala_7', name: 'Seven Mandalas', rarity: 'epic', test: (p: ProfileStats) => p.total_mandalas_completed >= 7 },
  { id: 'journal_keeper', name: 'Journal Keeper', rarity: 'rare', test: (p: ProfileStats) => p.total_journal_entries >= 30 }
] as const;

type ProfileStats = {
  id: string;
  badges: string[] | null;
  total_checkins: number;
  current_streak: number;
  total_mandalas_completed: number;
  total_journal_entries: number;
};

export async function checkAndAwardBadges(profile: ProfileStats) {
  const earned = new Set(profile.badges ?? []);
  const newBadges = BADGES.filter((badge) => !earned.has(badge.id) && badge.test(profile));
  if (!newBadges.length) return [];

  const updated = [...earned, ...newBadges.map((b) => b.id)];
  const { error } = await supabase.from('profiles').update({ badges: updated }).eq('id', profile.id);
  if (error) throw error;

  await Promise.all(
    newBadges.map((badge) =>
      supabase.from('notifications').insert({
        user_id: profile.id,
        title: 'Badge earned!',
        body: `You unlocked ${badge.name}`,
        notification_type: 'badge',
        data: { badge_id: badge.id, rarity: badge.rarity }
      })
    )
  );

  return newBadges;
}
