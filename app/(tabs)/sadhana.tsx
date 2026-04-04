import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import type { Sadhana } from '@/types';

export default function SadhanaScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Sadhana | null>(null);

  const { data: practices = [] } = useQuery({
    queryKey: ['sadhanas'],
    queryFn: async (): Promise<Sadhana[]> => [],
  });

  const createMandala = useMutation({
    mutationFn: async (_sessionType: 'morning' | 'evening' | 'both') => {
      // Use mandala creation via Cloudflare Worker instead
      void user; void selected;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['home-mandalas'] });
      setSelected(null);
    },
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Sadhana Practices</Text>
      <Text style={{ color: theme.colors.text2 }}>
        Start a 42-day <Text style={{ color: theme.colors.orange, fontWeight: '700' }}>Mandala</Text> for any practice
      </Text>

      {practices.map((p) => (
        <View key={p.id} style={[styles.card, { backgroundColor: theme.colors.surface }, theme.shadow.raised]}>
          <Text style={{ fontSize: 24 }}>{p.icon ?? '🕉️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{p.name}</Text>
            <Text style={{ color: theme.colors.text3, fontSize: 12 }}>
              {p.duration_minutes_morning ?? 0}m / {p.duration_minutes_evening ?? 0}m · {p.allows_evening ? 'Twice daily' : 'Morning only'}
            </Text>
          </View>
          <Pressable onPress={() => setSelected(p)} style={[styles.btn, { borderColor: theme.colors.orange }]}>
            <Text style={{ color: theme.colors.orange, fontWeight: '700' }}>+ Mandala</Text>
          </Pressable>
        </View>
      ))}

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.sheetWrap} onPress={() => setSelected(null)}>
          <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <Text style={{ color: theme.colors.text, fontSize: 20, fontWeight: '700' }}>Start 42-day Mandala</Text>
            {(['morning', 'evening', 'both'] as const).map((session) => (
              <Pressable key={session} onPress={() => createMandala.mutate(session)} style={[styles.sessionBtn, { backgroundColor: theme.colors.surface2 }]}>
                <Text style={{ color: theme.colors.text, textTransform: 'capitalize' }}>{session}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 120 },
  title: { fontSize: 30, fontWeight: '700' },
  card: { borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn: { borderWidth: 1.4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, gap: 10 },
  sessionBtn: { borderRadius: 14, padding: 14 },
});
