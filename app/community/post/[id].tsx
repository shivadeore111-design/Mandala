import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/utils/colors';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const postQuery = useQuery({
    queryKey: ['post-detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, post_type, created_at, profiles:user_id(username)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as any;
    }
  });

  const commentsQuery = useQuery({
    queryKey: ['post-comments', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('id, parent_comment_id, content, created_at, profiles:user_id(username)')
        .eq('post_id', id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
  });

  const commentMutation = useMutation({
    mutationFn: async ({ parentCommentId }: { parentCommentId?: string | null }) => {
      if (!comment.trim()) throw new Error('Comment cannot be empty');
      const { error } = await supabase.from('comments').insert({
        post_id: id,
        user_id: user!.id,
        content: comment.trim(),
        parent_comment_id: parentCommentId ?? null
      });
      if (error) throw error;
      await supabase.from('posts').update({ comment_count: (postQuery.data?.comment_count ?? 0) + 1 }).eq('id', id);
    },
    onSuccess: async () => {
      setComment('');
      await queryClient.invalidateQueries({ queryKey: ['post-comments', id] });
    }
  });

  const rootComments = (commentsQuery.data ?? []).filter((item: any) => !item.parent_comment_id);
  const repliesMap = new Map<string, any[]>();
  for (const item of commentsQuery.data ?? []) {
    if (!item.parent_comment_id) continue;
    const next = repliesMap.get(item.parent_comment_id) ?? [];
    next.push(item);
    repliesMap.set(item.parent_comment_id, next);
  }

  return (
    <View style={styles.container}>
      <Card style={{ margin: 12 }}>
        <Text style={styles.author}>@{((postQuery.data?.profiles as any)?.username ?? 'seeker')}</Text>
        <Text style={styles.content}>{postQuery.data?.content}</Text>
      </Card>
      <FlatList
        data={rootComments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.commentWrap}>
            <Text style={styles.author}>@{((item.profiles as any)?.username ?? 'seeker')}</Text>
            <Text style={styles.content}>{item.content}</Text>
            {(repliesMap.get(item.id) ?? []).map((reply) => (
              <View key={reply.id} style={styles.reply}>
                <Text style={styles.author}>@{((reply.profiles as any)?.username ?? 'seeker')}</Text>
                <Text style={styles.content}>{reply.content}</Text>
              </View>
            ))}
            <Button title="Reply" variant="ghost" onPress={() => commentMutation.mutate({ parentCommentId: item.id })} />
          </View>
        )}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment"
          placeholderTextColor={COLORS.TEXT_MUTED}
          value={comment}
          onChangeText={setComment}
        />
        <Button title="Send" onPress={() => commentMutation.mutate({})} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  author: { color: COLORS.ACCENT, fontWeight: '700' },
  content: { color: COLORS.TEXT, marginTop: 4 },
  commentWrap: { marginHorizontal: 12, marginBottom: 10, backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#2A2A4E' },
  reply: { marginTop: 8, marginLeft: 12, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#3A3A66' },
  inputBar: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#2A2A4E', backgroundColor: COLORS.SURFACE },
  input: { flex: 1, backgroundColor: COLORS.BACKGROUND, borderWidth: 1, borderColor: '#2A2A4E', borderRadius: 10, color: COLORS.TEXT, paddingHorizontal: 10 }
});
