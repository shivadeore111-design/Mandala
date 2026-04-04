import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { COLORS } from '@/utils/colors';

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const entryQuery = useQuery({
    queryKey: ['journal-entry', id],
    enabled: Boolean(id),
    queryFn: async (): Promise<any> => null,
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const entry = entryQuery.data;

  useEffect(() => {
    if (!entry) return;
    setTitle(entry.title ?? '');
    setContent(entry.content ?? '');
    setTags((entry.tags ?? []).join(', '));
  }, [entry]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Journal persistence not yet implemented in Cloudflare Worker
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      await queryClient.invalidateQueries({ queryKey: ['journal-entry', id] });
      router.back();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Journal persistence not yet implemented in Cloudflare Worker
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      router.replace('/journal');
    }
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Edit Entry</Text>
      <Input label="Title" value={title} onChangeText={setTitle} />
      <Text style={styles.label}>Content</Text>
      <TextInput style={styles.contentInput} multiline value={content} onChangeText={setContent} />
      <Input label="Tags" value={tags} onChangeText={setTags} />
      <Button title="Save Changes" onPress={() => updateMutation.mutate()} loading={updateMutation.isPending} />
      <Button
        title="Delete"
        variant="secondary"
        onPress={() =>
          Alert.alert('Delete entry?', 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() }
          ])
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { padding: 16, gap: 12, paddingBottom: 28 },
  heading: { color: COLORS.TEXT, fontSize: 24, fontWeight: '700' },
  label: { color: COLORS.TEXT, fontWeight: '600' },
  contentInput: { minHeight: 200, borderWidth: 1, borderColor: '#2A2A4E', borderRadius: 12, backgroundColor: COLORS.SURFACE, color: COLORS.TEXT, padding: 12, textAlignVertical: 'top' }
});
