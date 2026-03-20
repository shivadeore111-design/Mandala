import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/utils/colors';

type Entry = { id: string; title: string; content: string; mood: string | null; tags: string[] | null; created_at: string };

type Contemplation = { quote: string; journal_prompt: string };

export default function JournalIndexScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const entriesQuery = useQuery({
    queryKey: ['journal-entries', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, title, content, mood, tags, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Entry[];
    }
  });

  const contemplationQuery = useQuery({
    queryKey: ['daily-contemplation-top', new Date().toISOString().slice(0, 10)],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('daily_contemplations')
        .select('quote, journal_prompt')
        .eq('contemplation_date', today)
        .maybeSingle();
      return data as Contemplation | null;
    }
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={entriesQuery.data ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          contemplationQuery.data ? (
            <Card style={{ marginBottom: 12 }}>
              <Text style={styles.title}>Today's Prompt</Text>
              <Text style={styles.quote}>“{contemplationQuery.data.quote}”</Text>
              <Pressable onPress={() => router.push(`/journal/new?prompt=${encodeURIComponent(contemplationQuery.data?.journal_prompt ?? '')}`)}>
                <Text style={styles.link}>Write from this prompt →</Text>
              </Pressable>
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/journal/${item.id}`)}>
            <Card style={{ marginBottom: 10 }}>
              <Text style={styles.entryDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              <Text style={styles.entryTitle}>{item.title || item.content.slice(0, 60)}</Text>
              <Text style={styles.meta}>{moodToEmoji(item.mood)} {(item.tags ?? []).join(', ')}</Text>
            </Card>
          </Pressable>
        )}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/journal/new')}>
        <Ionicons name="add" color={COLORS.BACKGROUND} size={24} />
      </Pressable>
    </View>
  );
}

function moodToEmoji(mood: string | null) {
  if (!mood) return '🙂';
  const map: Record<string, string> = {
    restless: '😵', anxious: '😟', dull: '😶', neutral: '🙂', peaceful: '😌', joyful: '😊', blissful: '🤍', grateful: '🙏'
  };
  return map[mood] ?? '🙂';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND, padding: 12 },
  title: { color: COLORS.TEXT, fontWeight: '700', fontSize: 16 },
  quote: { color: COLORS.ACCENT, marginTop: 6, fontStyle: 'italic' },
  link: { color: COLORS.PRIMARY, marginTop: 10, fontWeight: '600' },
  entryDate: { color: COLORS.TEXT_MUTED, fontSize: 12 },
  entryTitle: { color: COLORS.TEXT, fontSize: 16, fontWeight: '700', marginTop: 2 },
  meta: { color: COLORS.TEXT_MUTED, marginTop: 6 },
  fab: { position: 'absolute', right: 16, bottom: 16, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.PRIMARY, alignItems: 'center', justifyContent: 'center' }
});
