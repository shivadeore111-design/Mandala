import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { COLORS } from '@/utils/colors';

type TabKey = 'feed' | 'circles' | 'nearby';

type Post = {
  id: string;
  content: string;
  image_url: string | null;
  post_type: 'text' | 'question' | 'reflection' | 'milestone';
  like_count: number;
  comment_count: number;
  created_at: string;
  profiles: {
    avatar_url: string | null;
    username: string;
    full_name: string;
    current_streak: number;
  } | null;
};

const PAGE_SIZE = 20;

export default function CommunityScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const [createVisible, setCreateVisible] = useState(false);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'text' | 'question' | 'reflection'>('text');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const postsQuery = useInfiniteQuery({
    queryKey: ['community-posts', user?.id],
    enabled: Boolean(user?.id),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from('posts')
        .select('id, content, image_url, post_type, like_count, comment_count, created_at, profiles:user_id(avatar_url, username, full_name, current_streak)')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return (data ?? []) as unknown as Post[];
    },
    getNextPageParam: (lastPage, allPages) => (lastPage.length < PAGE_SIZE ? undefined : allPages.length)
  });

  const postLikesQuery = useQuery({
    queryKey: ['post-likes', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from('post_likes').select('post_id').eq('user_id', user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((item) => item.post_id));
    }
  });

  const createPost = useMutation({
    mutationFn: async () => {
      if (!content.trim()) throw new Error('Post content is required.');
      const { error } = await supabase.from('posts').insert({
        user_id: user!.id,
        content: content.trim(),
        image_url: selectedImage ?? '',
        post_type: postType
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setContent('');
      setPostType('text');
      setSelectedImage(null);
      setCreateVisible(false);
      await queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    }
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (liked) {
        const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: user!.id });
        if (error) throw error;
      }
      return { postId, liked };
    },
    onMutate: async ({ postId, liked }) => {
      const likedSet = new Set(postLikesQuery.data ?? []);
      if (liked) likedSet.delete(postId);
      else likedSet.add(postId);
      queryClient.setQueryData(['post-likes', user?.id], likedSet);

      queryClient.setQueryData(['community-posts', user?.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: Post[]) =>
            page.map((post) =>
              post.id === postId
                ? { ...post, like_count: Math.max(0, post.like_count + (liked ? -1 : 1)) }
                : post
            )
          )
        };
      });
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['community-posts'] }),
        queryClient.invalidateQueries({ queryKey: ['post-likes'] })
      ]);
    }
  });

  const flatPosts = useMemo(() => postsQuery.data?.pages.flat() ?? [], [postsQuery.data]);

  const myCircles = useQuery({
    queryKey: ['my-circles', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('circle_members')
        .select('circles:circle_id(id, name, member_count, circle_type)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data ?? []).map((item: any) => item.circles).filter(Boolean);
    }
  });

  const discoverCircles = useQuery({
    queryKey: ['discover-circles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('circles').select('id, name, member_count, circle_type').eq('is_public', true).order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
  });

  const profileQuery = useQuery({
    queryKey: ['profile-tier', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('subscription_tier').eq('id', user!.id).single();
      if (error) throw error;
      return data.subscription_tier as string;
    }
  });

  const [nearbyStatus, setNearbyStatus] = useState('Allow location to discover nearby seekers.');
  const [nearbyData, setNearbyData] = useState<any[]>([]);

  const requestNearby = async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setNearbyStatus('Location permission denied.');
      return;
    }

    const current = await Location.getCurrentPositionAsync({});
    setNearbyStatus('Fetching nearby seekers...');
    const { data, error } = await supabase.rpc('find_nearby_seekers', {
      user_lat: current.coords.latitude,
      user_lng: current.coords.longitude,
      radius_km: 100
    } as any);

    if (error) {
      setNearbyStatus('Unable to fetch seekers right now.');
      return;
    }

    setNearbyData(data ?? []);
    setNearbyStatus(data?.length ? '' : 'No nearby seekers found yet.');
  };

  const satsangsQuery = useQuery({
    queryKey: ['nearby-satsangs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('satsang_events').select('id, title, start_time, location_name, status').eq('status', 'upcoming').order('start_time', { ascending: true }).limit(5);
      if (error) throw error;
      return data ?? [];
    }
  });

  const renderFeed = () => (
    <>
      <FlatList
        data={flatPosts}
        keyExtractor={(item) => item.id}
        onEndReached={() => postsQuery.fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={postsQuery.isFetchingNextPage ? <ActivityIndicator color={COLORS.PRIMARY} /> : null}
        renderItem={({ item }) => {
          const isMilestone = item.post_type === 'milestone';
          const liked = postLikesQuery.data?.has(item.id) ?? false;
          return (
            <Pressable style={[styles.postCard, isMilestone && styles.milestoneCard]} onPress={() => router.push(`/community/post/${item.id}`)}>
              <View style={styles.postHeader}>
                <Avatar uri={item.profiles?.avatar_url} name={item.profiles?.full_name} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.username}>@{item.profiles?.username ?? 'seeker'}</Text>
                  <Text style={styles.meta}>🔥 {item.profiles?.current_streak ?? 0} days · {timeAgo(item.created_at)}</Text>
                </View>
                {isMilestone ? <Text style={styles.trident}>🔱</Text> : null}
              </View>
              <Text style={styles.postContent}>{item.content}</Text>
              {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.postImage} /> : null}
              <View style={styles.postActions}>
                <Pressable style={styles.actionButton} onPress={() => likeMutation.mutate({ postId: item.id, liked })}>
                  <Text style={[styles.actionText, liked && { color: COLORS.PRIMARY }]}>🙏 {item.like_count}</Text>
                </Pressable>
                <Text style={styles.actionText}>💬 {item.comment_count}</Text>
              </View>
            </Pressable>
          );
        }}
      />
      <Pressable style={styles.fab} onPress={() => setCreateVisible(true)}>
        <Ionicons name="add" color={COLORS.BACKGROUND} size={24} />
      </Pressable>
    </>
  );

  const renderCircleCard = (circle: any) => (
    <Pressable key={circle.id} style={styles.circleCard} onPress={() => router.push(`/community/circle/${circle.id}?name=${encodeURIComponent(circle.name)}`)}>
      <Text style={styles.circleName}>{circle.name}</Text>
      <Text style={styles.circleMeta}>{circle.member_count ?? 0} members</Text>
      <View style={styles.circleBadge}><Text style={styles.circleBadgeText}>{circle.circle_type}</Text></View>
    </Pressable>
  );

  const renderCircles = () => (
    <ScrollView contentContainerStyle={styles.sectionContent}>
      <Text style={styles.sectionTitle}>My Circles</Text>
      {(myCircles.data ?? []).length ? (myCircles.data ?? []).map(renderCircleCard) : <Text style={styles.emptyText}>You have not joined any circles yet.</Text>}
      <Text style={styles.sectionTitle}>Discover</Text>
      {(discoverCircles.data ?? []).map(renderCircleCard)}
      <Button
        title="Create Circle"
        onPress={() => {
          if (profileQuery.data !== 'guide') {
            alert('Create Circle is available on the Guide tier.');
            return;
          }
          alert('Create Circle flow coming soon.');
        }}
      />
    </ScrollView>
  );

  const renderNearby = () => (
    <ScrollView contentContainerStyle={styles.sectionContent}>
      <Button title="Find Nearby Seekers" onPress={requestNearby} />
      {nearbyStatus ? <Text style={styles.emptyText}>{nearbyStatus}</Text> : null}
      {nearbyData.map((seeker: any, idx) => (
        <Card key={seeker.id ?? idx}>
          <View style={styles.seekerRow}>
            <Avatar uri={seeker.avatar_url} name={seeker.full_name} size={40} />
            <View>
              <Text style={styles.username}>{seeker.full_name ?? seeker.username ?? 'Seeker'}</Text>
              <Text style={styles.meta}>{Math.round((seeker.distance_km ?? 0) * 10) / 10} km away · 🔥 {seeker.current_streak ?? 0}</Text>
              <Text style={styles.meta}>Mandalas completed: {seeker.total_mandalas_completed ?? 0}</Text>
            </View>
          </View>
        </Card>
      ))}
      <Text style={styles.sectionTitle}>Upcoming Satsangs Near You</Text>
      {(satsangsQuery.data ?? []).length ? (
        (satsangsQuery.data ?? []).map((event) => (
          <Card key={event.id}>
            <Text style={styles.circleName}>{event.title}</Text>
            <Text style={styles.meta}>{new Date(event.start_time).toLocaleString()}</Text>
            <Text style={styles.meta}>{event.location_name || 'Location details coming soon'}</Text>
          </Card>
        ))
      ) : (
        <Text style={styles.emptyText}>No nearby satsangs yet.</Text>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <Segment label="Feed" active={activeTab === 'feed'} onPress={() => setActiveTab('feed')} />
        <Segment label="Circles" active={activeTab === 'circles'} onPress={() => setActiveTab('circles')} />
        <Segment label="Nearby" active={activeTab === 'nearby'} onPress={() => setActiveTab('nearby')} />
      </View>

      <View style={{ flex: 1 }}>{activeTab === 'feed' ? renderFeed() : activeTab === 'circles' ? renderCircles() : renderNearby()}</View>

      <Modal visible={createVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.sectionTitle}>Create Post</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Share your reflection..."
              placeholderTextColor={COLORS.TEXT_MUTED}
              multiline
              style={styles.modalInput}
            />
            <View style={styles.rowGap}>
              {(['text', 'question', 'reflection'] as const).map((type) => (
                <Pressable key={type} style={[styles.pill, postType === type && styles.pillActive]} onPress={() => setPostType(type)}>
                  <Text style={styles.pillText}>{type}</Text>
                </Pressable>
              ))}
            </View>
            {selectedImage ? <Text style={styles.meta}>Image selected ✓</Text> : null}
            <Button
              title="Pick optional image"
              variant="secondary"
              onPress={async () => {
                const media = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true });
                if (!media.canceled && media.assets?.[0]?.uri) setSelectedImage(media.assets[0].uri);
              }}
            />
            <Button title="Submit" onPress={() => createPost.mutate()} loading={createPost.isPending} />
            <Button title="Cancel" variant="ghost" onPress={() => setCreateVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.segment, active && styles.segmentActive]} onPress={onPress}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  tabRow: { flexDirection: 'row', padding: 12, gap: 8 },
  segment: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#2A2A4E', alignItems: 'center' },
  segmentActive: { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  segmentText: { color: COLORS.TEXT, fontWeight: '600' },
  segmentTextActive: { color: COLORS.BACKGROUND },
  postCard: { backgroundColor: COLORS.SURFACE, marginHorizontal: 12, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: '#2A2A4E', padding: 12, gap: 10 },
  milestoneCard: { borderColor: '#D4AF37', borderWidth: 2 },
  postHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  username: { color: COLORS.TEXT, fontWeight: '700' },
  meta: { color: COLORS.TEXT_MUTED, fontSize: 12 },
  trident: { fontSize: 18 },
  postContent: { color: COLORS.TEXT, lineHeight: 20 },
  postActions: { flexDirection: 'row', gap: 18 },
  actionButton: { paddingVertical: 2 },
  actionText: { color: COLORS.TEXT_MUTED, fontWeight: '600' },
  fab: { position: 'absolute', right: 16, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.PRIMARY, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' },
  modalCard: { backgroundColor: COLORS.SURFACE, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, gap: 12 },
  modalInput: { minHeight: 120, backgroundColor: COLORS.BACKGROUND, borderRadius: 12, padding: 12, color: COLORS.TEXT, borderWidth: 1, borderColor: '#2A2A4E' },
  rowGap: { flexDirection: 'row', gap: 8 },
  pill: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2A2A4E', borderRadius: 999 },
  pillActive: { borderColor: COLORS.PRIMARY, backgroundColor: '#FF6B3520' },
  pillText: { color: COLORS.TEXT, textTransform: 'capitalize' },
  sectionContent: { padding: 12, gap: 10, paddingBottom: 30 },
  sectionTitle: { color: COLORS.TEXT, fontWeight: '700', fontSize: 18, marginTop: 4 },
  circleCard: { backgroundColor: COLORS.SURFACE, borderWidth: 1, borderColor: '#2A2A4E', borderRadius: 12, padding: 12, gap: 6 },
  circleName: { color: COLORS.TEXT, fontWeight: '700' },
  circleMeta: { color: COLORS.TEXT_MUTED },
  circleBadge: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#2B2B4E', paddingHorizontal: 10, paddingVertical: 4 },
  circleBadgeText: { color: COLORS.ACCENT, fontSize: 12, textTransform: 'capitalize' },
  emptyText: { color: COLORS.TEXT_MUTED },
  seekerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  postImage: { width: '100%', height: 180, borderRadius: 10 }
});
