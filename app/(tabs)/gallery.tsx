import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { Artwork } from '@/types';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 2;

const CATEGORIES = ['All', 'Mandala', 'Yantra', 'Digital', 'Painting', 'Photography'];
const ART_ICONS: Record<string, string> = { mandala: '🌸', yantra: '🔯', digital: '💻', painting: '🎨', photography: '📸', other: '✨' };

export default function GalleryScreen() {
  const t = useTheme();

  const { data: artworks } = useQuery<Artwork[]>({
    queryKey: ['artworks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('artworks')
        .select('*, profile:profiles(username, avatar_url)')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    header: { padding: 20, paddingBottom: 0 },
    title: { fontSize: 22, fontWeight: '800', color: t.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: t.text3, marginBottom: 14 },
    searchBox: {
      backgroundColor: t.surface2, borderRadius: 12, padding: 12, flexDirection: 'row',
      alignItems: 'center', gap: 8, marginBottom: 14,
      shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4,
    },
    searchText: { fontSize: 14, color: t.text3, flex: 1 },
    catRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    catPill: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
      shadowColor: t.shadowDark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 3,
    },
    catText: { fontSize: 12, fontWeight: '600' },
    sponsoredCard: {
      marginHorizontal: 20, marginBottom: 14, padding: 14, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: t.bg,
      shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4,
      borderWidth: 1, borderColor: t.border,
    },
    sponsorLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: t.goldBg, alignItems: 'center', justifyContent: 'center' },
    sponsorCta: { borderWidth: 1, borderColor: t.orange, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
    grid: { paddingHorizontal: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    artCard: {
      width: CARD_W, borderRadius: 16, overflow: 'hidden',
      backgroundColor: t.bg,
      shadowColor: t.shadowDark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 6,
    },
    artImg: { width: CARD_W, height: CARD_W, alignItems: 'center', justifyContent: 'center' },
    artInfo: { padding: 10, backgroundColor: t.surface },
    artTitle: { fontSize: 13, fontWeight: '700', color: t.text, marginBottom: 2 },
    artArtist: { fontSize: 10, color: t.text3, marginBottom: 4 },
    artPrice: { fontSize: 12, fontWeight: '700', color: t.orange },
    emptyBox: {
      margin: 20, padding: 40, alignItems: 'center', borderRadius: 20,
      backgroundColor: t.bg,
      shadowColor: t.shadowDark, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 12, elevation: 8,
    },
  });

  const bgColors = ['#1A0F2E', '#0F1A20', '#1A1A0F', '#0F1A18', '#1A100F', '#101A0F'];

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Sacred Gallery</Text>
          <Text style={s.subtitle}>Art by the community · Buy & Sell</Text>

          <View style={s.searchBox}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <Text style={s.searchText}>Search mandalas, yantras, art...</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
            {CATEGORIES.map((cat, i) => (
              <TouchableOpacity key={cat} style={[s.catPill, { backgroundColor: i === 0 ? t.orangeBg : t.bg }]}>
                <Text style={[s.catText, { color: i === 0 ? t.orange : t.text3 }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sponsored content */}
        <View style={s.sponsoredCard}>
          <View style={s.sponsorLogo}>
            <Text style={{ fontSize: 22 }}>🪔</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, color: t.text3, marginBottom: 2, letterSpacing: 0.5 }}>SPONSORED</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: t.text, marginBottom: 2 }}>Isha Rudraksha Collection</Text>
            <Text style={{ fontSize: 11, color: t.text3 }}>Authentic, energised malas & more</Text>
          </View>
          <TouchableOpacity style={s.sponsorCta}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: t.orange }}>Shop</Text>
          </TouchableOpacity>
        </View>

        {artworks && artworks.length > 0 ? (
          <View style={s.grid}>
            {artworks.map((art, idx) => (
              <TouchableOpacity key={art.id} style={s.artCard}>
                <View style={[s.artImg, { backgroundColor: bgColors[idx % bgColors.length] }]}>
                  {art.image_url ? (
                    <Image source={{ uri: art.image_url }} style={{ width: CARD_W, height: CARD_W }} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize: 48 }}>{ART_ICONS[art.art_type] || '✨'}</Text>
                  )}
                </View>
                <View style={s.artInfo}>
                  <Text style={s.artTitle} numberOfLines={1}>{art.title}</Text>
                  <Text style={s.artArtist}>by @{(art as any).profile?.username || 'artist'}</Text>
                  <Text style={s.artPrice}>
                    {art.is_for_sale ? `₹${art.price_inr.toLocaleString('en-IN')}` : 'Not for sale'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={s.emptyBox}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎨</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: t.text, marginBottom: 6 }}>Gallery is Empty</Text>
            <Text style={{ fontSize: 13, color: t.text3, textAlign: 'center' }}>Be the first to share your sacred art with the community</Text>
            <TouchableOpacity style={{
              marginTop: 16, backgroundColor: t.orange, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>+ Upload Artwork</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}
