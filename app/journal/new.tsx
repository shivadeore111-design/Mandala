import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/utils/colors';

const MOODS = [
  { key: 'restless', emoji: '😵' },
  { key: 'anxious', emoji: '😟' },
  { key: 'neutral', emoji: '🙂' },
  { key: 'peaceful', emoji: '😌' },
  { key: 'joyful', emoji: '😊' },
  { key: 'blissful', emoji: '🤍' },
  { key: 'grateful', emoji: '🙏' }
] as const;

export default function NewJournalEntryScreen() {
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const draftKey = useMemo(() => `journal-draft-${user?.id ?? 'anon'}`, [user?.id]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string>('neutral');
  const [energy, setEnergy] = useState(3);
  const [tags, setTags] = useState('');

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(draftKey);
      if (!raw) return;
      try {
        const draft = JSON.parse(raw);
        setTitle(draft.title ?? '');
        setContent(draft.content ?? '');
        setMood(draft.mood ?? 'neutral');
        setEnergy(draft.energy ?? 3);
        setTags(draft.tags ?? '');
      } catch {
        // ignore
      }
    })();
  }, [draftKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      AsyncStorage.setItem(draftKey, JSON.stringify({ title, content, mood, energy, tags }));
    }, 5000);
    return () => clearInterval(interval);
  }, [content, draftKey, energy, mood, tags, title]);

  useEffect(() => {
    if (prompt && !content) {
      setContent(String(prompt));
    }
  }, [prompt, content]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!content.trim()) throw new Error('Content is required.');
      // Journal persistence not yet implemented in Cloudflare Worker
      void user;
    },
    onSuccess: async () => {
      await AsyncStorage.removeItem(draftKey);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['journal-entries'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      ]);
      router.replace('/journal');
    },
    onError: (error: any) => Alert.alert('Save failed', error.message)
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>New Journal Entry</Text>
      <Input label="Title (optional)" value={title} onChangeText={setTitle} placeholder="Today's reflection" />
      <Text style={styles.label}>Content</Text>
      <TextInput
        style={styles.contentInput}
        multiline
        value={content}
        onChangeText={setContent}
        placeholder="Write your contemplation..."
        placeholderTextColor={COLORS.TEXT_MUTED}
      />

      <Text style={styles.label}>Mood</Text>
      <View style={styles.row}>{MOODS.map((item) => <Text key={item.key} style={[styles.mood, mood === item.key && styles.selectedMood]} onPress={() => setMood(item.key)}>{item.emoji}</Text>)}</View>

      <Text style={styles.label}>Energy Level</Text>
      <View style={styles.row}>{[1, 2, 3, 4, 5].map((value) => <Text key={value} style={[styles.dot, value <= energy && styles.activeDot]} onPress={() => setEnergy(value)}>●</Text>)}</View>

      <Input label="Tags (comma-separated)" value={tags} onChangeText={setTags} placeholder="gratitude, stillness" />
      <Button title="Save Entry" onPress={() => saveMutation.mutate()} loading={saveMutation.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { padding: 16, gap: 12, paddingBottom: 30 },
  heading: { color: COLORS.TEXT, fontSize: 24, fontWeight: '700' },
  label: { color: COLORS.TEXT, fontWeight: '600' },
  contentInput: { minHeight: 200, borderWidth: 1, borderColor: '#2A2A4E', borderRadius: 12, backgroundColor: COLORS.SURFACE, color: COLORS.TEXT, padding: 12, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  mood: { fontSize: 26, padding: 6, borderWidth: 1, borderColor: 'transparent', borderRadius: 8 },
  selectedMood: { borderColor: COLORS.PRIMARY, backgroundColor: '#FF6B3522' },
  dot: { color: '#555', fontSize: 24 },
  activeDot: { color: COLORS.PRIMARY }
});
