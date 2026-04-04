import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { Artwork } from '@/types';

const categories = ['All', 'Mandala', 'Yantra', 'Digital', 'Painting', 'Photography'];

export default function GalleryScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const { data: artworks = [] } = useQuery({
    queryKey: ['artworks'],
    queryFn: async (): Promise<Artwork[]> => [],
  });

  const { data: sponsored } = useQuery({
    queryKey: ['sponsored'],
    queryFn: async (): Promise<{ brand_name?: string; description?: string } | null> => null,
  });

  const filtered = useMemo(() => artworks.filter((a) => (category === 'All' || a.art_type === category) && a.title.toLowerCase().includes(query.toLowerCase())), [artworks, category, query]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Sacred Gallery</Text>
      <Text style={{ color: theme.colors.text2 }}>Art by the community · Buy & Sell</Text>
      <View style={[styles.searchWrap, { backgroundColor: theme.colors.surface2 }]}>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search artwork" placeholderTextColor={theme.colors.text3} style={{ color: theme.colors.text }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {categories.map((c) => <Pressable key={c} onPress={() => setCategory(c)} style={[styles.catPill, { backgroundColor: c === category ? theme.colors.orange : theme.colors.surface }]}><Text style={{ color: c === category ? '#fff' : theme.colors.text2 }}>{c}</Text></Pressable>)}
      </ScrollView>

      <View style={[styles.sponsored, { backgroundColor: theme.colors.surface }, theme.shadow.raised]}>
        <Text style={{ color: theme.colors.gold, fontWeight: '700' }}>Sponsored</Text>
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{sponsored?.brand_name ?? 'Isha Life'}</Text>
        <Text style={{ color: theme.colors.text2 }}>{sponsored?.description ?? 'Meditation essentials for your sacred corner.'}</Text>
        <Pressable style={[styles.shop, { backgroundColor: theme.colors.orange }]}><Text style={{ color: '#fff', fontWeight: '700' }}>Shop</Text></Pressable>
      </View>

      {filtered.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: theme.colors.surface }]}>
          <Text style={{ color: theme.colors.text2 }}>No art found yet.</Text>
          <Pressable style={[styles.shop, { backgroundColor: theme.colors.orange }]}><Text style={{ color: '#fff' }}>Upload your first artwork</Text></Pressable>
        </View>
      ) : (
        <View style={styles.grid}>
          {filtered.map((a) => (
            <View key={a.id} style={[styles.artCard, { backgroundColor: theme.colors.surface }, theme.shadow.raised]}>
              <View style={[styles.image, { backgroundColor: theme.colors.surface2 }]}><Text style={{ fontSize: 26 }}>🖼️</Text></View>
              <Text style={{ color: theme.colors.text, fontWeight: '700' }} numberOfLines={1}>{a.title}</Text>
              <Text style={{ color: theme.colors.text3 }} numberOfLines={1}>@{a.profile?.username ?? 'sadhaka'}</Text>
              <Text style={{ color: theme.colors.green }}>{a.is_for_sale ? `₹${a.price_inr ?? 0}` : 'Not for sale'}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 120, gap: 12 },
  title: { fontSize: 30, fontWeight: '700' },
  searchWrap: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  catPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  sponsored: { borderRadius: 16, padding: 12, gap: 4 },
  shop: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  artCard: { width: '48%', borderRadius: 14, padding: 10, gap: 4 },
  image: { height: 90, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  empty: { borderRadius: 14, alignItems: 'center', padding: 18, gap: 8 },
});
