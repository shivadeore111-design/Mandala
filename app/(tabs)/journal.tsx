import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import type { DailyContemplation, JournalEntry } from '@/types';

const moods = [
  { value: 'restless', label: '😵 Restless' },
  { value: 'dull', label: '😶 Dull' },
  { value: 'neutral', label: '🙂 Neutral' },
  { value: 'peaceful', label: '😌 Peaceful' },
  { value: 'blissful', label: '✨ Blissful' },
] as const;

export default function JournalScreen() {
  const theme = useTheme();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<(typeof moods)[number]['value']>('neutral');
  const [energy, setEnergy] = useState(3);

  const { data: prompt } = useQuery({
    queryKey: ['journal-prompt'],
    queryFn: async (): Promise<DailyContemplation | null> => null,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['journal', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<JournalEntry[]> => [],
  });

  const createEntry = useMutation({
    mutationFn: async () => {
      // Journal persistence not yet implemented in Cloudflare Worker
      void user; void title; void content; void mood; void energy;
    },
    onSuccess: () => {
      setOpen(false);
      setTitle('');
      setContent('');
      qc.invalidateQueries({ queryKey: ['journal'] });
    },
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}><Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '700' }}>{new Date().toDateString()}</Text><Pressable style={[styles.writeBtn, { backgroundColor: theme.colors.orange }]} onPress={() => setOpen(true)}><Text style={{ color: '#fff', fontWeight: '700' }}>+ Write</Text></Pressable></View>
      <Pressable style={[styles.prompt, { borderLeftColor: theme.colors.gold, backgroundColor: theme.colors.surface2 }]} onPress={() => setOpen(true)}>
        <Text style={{ color: theme.colors.text2 }}>Today's prompt</Text>
        <Text style={{ color: theme.colors.text }}>{prompt?.quote ?? 'What offered clarity in your practice today?'}</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{moods.map((m) => <View key={m.value} style={[styles.moodPill, { backgroundColor: mood === m.value ? theme.colors.orange : theme.colors.surface }]}><Text style={{ color: mood === m.value ? '#fff' : theme.colors.text2 }}>{m.label}</Text></View>)}</View>
      {entries.map((entry) => (
        <View key={entry.id} style={[styles.entry, { backgroundColor: theme.colors.surface }, theme.shadow.raised]}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{entry.title}</Text>
          <Text style={{ color: theme.colors.text2 }} numberOfLines={2}>{entry.content}</Text>
          <Text style={{ color: theme.colors.text3 }}>{entry.mood} · Energy {(entry as any).energy_level ?? 0}/5</Text>
        </View>
      ))}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16, gap: 10 }}>
          <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '700' }}>New Entry</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={theme.colors.text3} style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface }]} />
          <TextInput value={content} onChangeText={setContent} multiline numberOfLines={6} placeholder="Pour your reflection..." placeholderTextColor={theme.colors.text3} style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.surface, minHeight: 160, textAlignVertical: 'top' }]} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{moods.map((m) => <Pressable key={m.value} onPress={() => setMood(m.value)} style={[styles.moodPill, { backgroundColor: mood === m.value ? theme.colors.orange : theme.colors.surface }]}><Text style={{ color: mood === m.value ? '#fff' : theme.colors.text2 }}>{m.label}</Text></Pressable>)}</View>
          <View style={{ flexDirection: 'row', gap: 8 }}>{[1,2,3,4,5].map((n) => <Pressable key={n} onPress={() => setEnergy(n)} style={[styles.energy, { backgroundColor: energy === n ? theme.colors.greenBg : theme.colors.surface }]}><Text style={{ color: theme.colors.text }}> {n} </Text></Pressable>)}</View>
          <Pressable onPress={() => createEntry.mutate()} style={[styles.writeBtn, { backgroundColor: theme.colors.orange, alignSelf: 'stretch' }]}><Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Save Entry</Text></Pressable>
          <Pressable onPress={() => setOpen(false)}><Text style={{ color: theme.colors.text2, textAlign: 'center' }}>Cancel</Text></Pressable>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 120, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  writeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  prompt: { borderLeftWidth: 4, borderRadius: 12, padding: 12 },
  moodPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  entry: { borderRadius: 14, padding: 12, gap: 6 },
  input: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  energy: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
});
