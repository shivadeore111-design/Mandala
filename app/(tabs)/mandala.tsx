import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Mandala } from '@/types';

const iconButton = (type: 'back' | 'play' | 'forward', color: string) => (
  <Svg width={22} height={22} viewBox="0 0 22 22">
    {type === 'back' ? <Path d="M14 5 L7 11 L14 17 Z M17 5 L10 11 L17 17 Z" fill={color} /> : null}
    {type === 'forward' ? <Path d="M8 5 L15 11 L8 17 Z M5 5 L12 11 L5 17 Z" fill={color} /> : null}
    {type === 'play' ? <Path d="M8 5 L16 11 L8 17 Z" fill={color} /> : null}
  </Svg>
);

export default function MandalaScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<Mandala | null>(null);
  const [seconds, setSeconds] = useState(25 * 60);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    if (!selected || paused) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [paused, selected]);

  const { data: mandalas = [] } = useQuery({
    queryKey: ['mandalas', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('mandalas').select('*, sadhanas(*)').eq('user_id', user!.id).eq('status', 'active');
      return (data ?? []) as Mandala[];
    },
  });

  const total = 25 * 60;
  const pct = (total - seconds) / total;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Active Mandalas</Text>
      {mandalas.map((m) => (
        <Pressable key={m.id} onPress={() => { setSelected(m); setSeconds((m.sadhanas?.morning_duration_min ?? 25) * 60); setPaused(true); }} style={[styles.card, { backgroundColor: theme.colors.surface }, theme.shadow.raised]}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{m.sadhanas?.name ?? 'Practice'}</Text>
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.surface2 }]}>
            <View style={[styles.progressFill, { width: `${(m.day_count / 42) * 100}%`, backgroundColor: theme.colors.orange }]} />
          </View>
          <Text style={{ color: theme.colors.text2 }}>Day {m.day_count} / 42</Text>
        </Pressable>
      ))}

      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={[styles.modal, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.badge, { color: theme.colors.orange, borderColor: theme.colors.orange }]}>MANDALA DAY {selected?.day_count ?? 1}</Text>
          <View style={[styles.timerCircle, { backgroundColor: theme.colors.surface }, theme.shadow.raised]}>
            <Svg width={260} height={260}>
              <Circle cx="130" cy="130" r="110" stroke={theme.colors.border} strokeWidth="10" fill="none" />
              {Array.from({ length: 60 }).map((_, i) => {
                const a = (i / 60) * Math.PI * 2;
                const x1 = 130 + Math.cos(a) * 90;
                const y1 = 130 + Math.sin(a) * 90;
                const x2 = 130 + Math.cos(a) * 106;
                const y2 = 130 + Math.sin(a) * 106;
                return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme.colors.text3} strokeWidth={i % 5 === 0 ? 2 : 1} />;
              })}
              <Circle cx="130" cy="130" r="96" stroke={theme.colors.orange} strokeWidth="6" strokeDasharray={`${pct * 603}, 603`} fill="none" rotation="-90" origin="130,130" />
              <Line x1="130" y1="20" x2="130" y2="42" stroke={theme.colors.danger} strokeWidth="3" />
            </Svg>
            <View style={[styles.lcd, { backgroundColor: theme.colors.lcdFace }]}>
              <Text style={[styles.lcdText, { color: theme.colors.lcdText }]}>{mm}:{ss}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <Pressable style={[styles.controlBtn, { backgroundColor: theme.colors.surface }, theme.shadow.raised]}>{iconButton('back', theme.colors.orange)}</Pressable>
            <Pressable style={[styles.controlBtn, { backgroundColor: theme.colors.surface }, theme.shadow.raised]} onPress={() => setPaused((p) => !p)}>{iconButton('play', theme.colors.orange)}</Pressable>
            <Pressable style={[styles.controlBtn, { backgroundColor: theme.colors.surface }, theme.shadow.raised]}>{iconButton('forward', theme.colors.orange)}</Pressable>
          </View>

          <View style={[styles.slider, { backgroundColor: theme.colors.surface2 }]}>
            {Array.from({ length: 50 }).map((_, i) => <View key={i} style={{ width: 2, height: i % 2 === 0 ? 14 : 8, backgroundColor: theme.colors.text3 }} />)}
          </View>

          <View style={styles.pills}>{[['Elapsed', `${Math.floor((total - seconds) / 60)}m`], ['Remaining', `${Math.ceil(seconds / 60)}m`], ['Total', `${Math.ceil(total / 60)}m`]].map(([k, v]) => <View key={k} style={[styles.pill, { backgroundColor: theme.colors.surface }]}><Text style={{ color: theme.colors.text3, fontSize: 11 }}>{k}</Text><Text style={{ color: theme.colors.text }}>{v}</Text></View>)}</View>
          <Pressable onPress={() => setSelected(null)}><Text style={{ color: theme.colors.text2, textAlign: 'center' }}>Close</Text></Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 120, gap: 12 },
  title: { fontSize: 30, fontWeight: '700' },
  card: { borderRadius: 16, padding: 14, gap: 8 },
  progressTrack: { height: 8, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%' },
  modal: { flex: 1, padding: 16, justifyContent: 'center', gap: 14 },
  badge: { borderWidth: 1, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'center', fontWeight: '700' },
  timerCircle: { alignSelf: 'center', borderRadius: 180, padding: 12 },
  lcd: { position: 'absolute', top: '46%', left: '38%', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  lcdText: { fontFamily: 'monospace', fontSize: 24, fontWeight: '700' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  controlBtn: { width: 52, height: 52, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  slider: { height: 26, borderRadius: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, borderRadius: 10, padding: 8, alignItems: 'center' },
});
