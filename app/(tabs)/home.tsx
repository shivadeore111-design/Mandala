import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { DailyContemplation, Mandala, SpiritualEvent } from '@/types';

export default function HomeScreen() {
  const theme = useTheme();
  const qc = useQueryClient();
  const { user, profile } = useAuthStore();

  const { data: mandalas = [] } = useQuery({
    queryKey: ['home-mandalas', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('mandalas').select('*, sadhanas(*)').eq('user_id', user!.id).eq('status', 'active');
      return (data ?? []) as Mandala[];
    },
  });

  const { data: contemplation } = useQuery({
    queryKey: ['today-contemplation'],
    queryFn: async () => {
      const date = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from('daily_contemplations').select('*').lte('date', date).order('date', { ascending: false }).limit(1).maybeSingle();
      return data as DailyContemplation | null;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from('spiritual_events').select('*').gte('event_date', today).order('event_date').limit(6);
      return (data ?? []) as SpiritualEvent[];
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async ({ mandalaId, session }: { mandalaId: string; session: 'morning' | 'evening' }) => {
      await supabase.from('mandala_checkins').insert({ mandala_id: mandalaId, user_id: user!.id, session, date: new Date().toISOString().slice(0, 10) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home-mandalas'] }),
  });

  const top = mandalas[0];
  const progress = top ? Math.min(top.day_count / 42, 1) : 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Namaskaram, {(profile?.full_name ?? profile?.username ?? 'Sadhaka').split(' ')[0]} 🙏</Text>
      <Text style={[styles.subtitle, { color: theme.colors.text2 }]}>Today's Sadhana</Text>

      <View style={[styles.dialWrap, { backgroundColor: theme.colors.surface }, theme.shadow.raised]}>
        <Svg width={220} height={220}>
          <Circle cx="110" cy="110" r="98" stroke={theme.colors.border} strokeWidth="10" fill="none" />
          {Array.from({ length: 60 }).map((_, i) => {
            const a = (i / 60) * Math.PI * 2;
            const x1 = 110 + Math.cos(a) * 84;
            const y1 = 110 + Math.sin(a) * 84;
            const x2 = 110 + Math.cos(a) * 95;
            const y2 = 110 + Math.sin(a) * 95;
            return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 5 === 0 ? theme.colors.orange : theme.colors.text3} strokeWidth={i % 5 === 0 ? 2 : 1} />;
          })}
          <Circle cx="110" cy="110" r="75" stroke={theme.colors.orange} strokeWidth="6" strokeDasharray={`${progress * 470}, 470`} strokeLinecap="round" fill="none" rotation="-90" origin="110,110" />
          <Line x1="110" y1="22" x2="110" y2="40" stroke={theme.colors.danger} strokeWidth="3" />
        </Svg>
        <View style={[styles.lcd, { backgroundColor: theme.colors.lcdFace }]}>
          <Text style={[styles.lcdText, { color: theme.colors.lcdText }]}>DAY {top?.day_count ?? 0}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>{['Mandalas completed', 'Day streak', 'Total days'].map((s, i) => <View key={s} style={[styles.stat, { backgroundColor: theme.colors.surface }, theme.shadow.raised]}><Text style={{ color: theme.colors.text3, fontSize: 12 }}>{s}</Text><Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '700' }}>{[2, top?.day_count ?? 0, 84][i]}</Text></View>)}</View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Today's Checklist</Text>
      {mandalas.map((m) => (
        <TouchableOpacity key={m.id} style={[styles.checkItem, { backgroundColor: theme.colors.surface }, theme.shadow.raised]} onPress={() => checkinMutation.mutate({ mandalaId: m.id, session: 'morning' })}>
          <Text style={{ color: theme.colors.text, flex: 1 }}>{m.sadhanas?.name ?? 'Practice'}</Text>
          <Text style={[styles.badge, { backgroundColor: theme.colors.goldBg, color: theme.colors.gold }]}>{m.session_type === 'both' ? 'Morning / Evening' : m.session_type}</Text>
        </TouchableOpacity>
      ))}

      <View style={[styles.contemplation, { backgroundColor: theme.colors.surface2, borderLeftColor: theme.colors.gold }]}>
        <Text style={{ color: theme.colors.text2, fontWeight: '700' }}>Contemplation</Text>
        <Text style={{ color: theme.colors.text, marginTop: 6 }}>{contemplation?.quote ?? 'Let every breath become an offering.'}</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Upcoming Events</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {events.map((e) => <View key={e.id} style={[styles.eventPill, { backgroundColor: theme.colors.greenBg }]}><Text style={{ color: theme.colors.green }}>{e.name}</Text></View>)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 120, gap: 10 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 16, marginBottom: 6 },
  dialWrap: { borderRadius: 120, alignItems: 'center', justifyContent: 'center', padding: 18, alignSelf: 'center' },
  lcd: { position: 'absolute', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  lcdText: { fontFamily: 'monospace', letterSpacing: 1.5, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { borderRadius: 14, padding: 10, flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  checkItem: { borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center' },
  badge: { fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, textTransform: 'capitalize' },
  contemplation: { borderLeftWidth: 4, borderRadius: 10, padding: 12, marginTop: 8 },
  eventPill: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
});
