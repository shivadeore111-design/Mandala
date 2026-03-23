import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Sadhana } from '@/types';
import { useRouter } from 'expo-router';

function NeoCard({ children, style, t }: any) {
  return (
    <View style={[{
      backgroundColor: t.bg, borderRadius: 16, padding: 16,
      shadowColor: t.shadowDark, shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1, shadowRadius: 10, elevation: 6,
    }, style]}>
      {children}
    </View>
  );
}

function StartMandalaModal({ sadhana, visible, onClose, t }: { sadhana: Sadhana | null; visible: boolean; onClose: () => void; t: any }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [sessionType, setSessionType] = useState<'morning' | 'evening' | 'both'>('both');
  const [loading, setLoading] = useState(false);

  const sessionOptions = [
    { key: 'morning', label: 'Morning only', available: sadhana?.allows_morning },
    { key: 'evening', label: 'Evening only', available: sadhana?.allows_evening },
    { key: 'both', label: 'Morning & Evening', available: sadhana?.allows_morning && sadhana?.allows_evening },
  ].filter(o => o.available);

  const handleStart = async () => {
    if (!sadhana || !user) return;
    setLoading(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 42);

      const { error } = await supabase.from('mandalas').insert({
        user_id: user.id,
        sadhana_id: sadhana.id,
        practice_name: sadhana.name,
        practice_type: sadhana.slug,
        session_type: sessionType,
        mandala_days: 42,
        target_days: 42,
        start_date: startDate.toISOString().split('T')[0],
        expected_end_date: endDate.toISOString().split('T')[0],
        status: 'active',
      });

      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['active-mandala'] });
      qc.invalidateQueries({ queryKey: ['mandalas'] });
      Alert.alert('🙏 Mandala Started!', `Your 42-day ${sadhana.name} journey begins today.`);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!sadhana) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: t.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 28 }}>{sadhana.icon}</Text>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: t.text }}>{sadhana.name}</Text>
              <Text style={{ fontSize: 12, color: t.text3 }}>42-Day Mandala</Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, color: t.text2, lineHeight: 20, marginBottom: 20 }}>{sadhana.description}</Text>

          <Text style={{ fontSize: 11, fontWeight: '700', color: t.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Session Preference</Text>

          {sessionOptions.map(opt => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setSessionType(opt.key as any)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, marginBottom: 8,
                backgroundColor: sessionType === opt.key ? t.orangeBg : t.surface,
                borderWidth: sessionType === opt.key ? 1.5 : 0,
                borderColor: sessionType === opt.key ? t.orange : 'transparent',
              }}
            >
              <View style={{
                width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                borderColor: sessionType === opt.key ? t.orange : t.border,
                alignItems: 'center', justifyContent: 'center',
              }}>
                {sessionType === opt.key && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.orange }} />}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: sessionType === opt.key ? t.orange : t.text }}>{opt.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={handleStart}
            disabled={loading}
            style={{
              backgroundColor: t.orange, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16,
              shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{loading ? 'Starting...' : '🙏 Begin 42-Day Mandala'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', marginTop: 14 }}>
            <Text style={{ fontSize: 14, color: t.text3 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function SadhanaScreen() {
  const t = useTheme();
  const [selected, setSelected] = useState<Sadhana | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data: sadhanas } = useQuery<Sadhana[]>({
    queryKey: ['sadhanas'],
    queryFn: async () => {
      const { data } = await supabase.from('sadhanas').select('*').order('sort_order');
      return data || [];
    },
  });

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20 },
    header: { marginBottom: 20 },
    title: { fontSize: 22, fontWeight: '800', color: t.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: t.text3 },
    mandalaWord: { color: t.orange, fontWeight: '700' },
    card: {
      flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12, padding: 16,
      backgroundColor: t.bg, borderRadius: 16,
      shadowColor: t.shadowDark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 6,
    },
    iconBox: {
      width: 48, height: 48, borderRadius: 14, backgroundColor: t.goldBg,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: t.shadowDark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 3,
    },
    name: { fontSize: 15, fontWeight: '700', color: t.text, marginBottom: 4 },
    meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 11, color: t.text3 },
    badge: { fontSize: 9, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
    startBtn: {
      borderWidth: 1.5, borderColor: t.orange, borderRadius: 999,
      paddingHorizontal: 14, paddingVertical: 6,
    },
    startText: { fontSize: 12, fontWeight: '700', color: t.orange },
  });

  const sessionLabel = (s: Sadhana) => {
    if (s.allows_morning && s.allows_evening) return { label: 'Twice daily', bg: t.greenBg, color: t.green };
    if (s.allows_morning) return { label: 'Morning only', bg: t.goldBg, color: t.gold };
    return { label: 'Evening only', bg: t.terraBg, color: t.terra };
  };

  const durationText = (s: Sadhana) => {
    if (s.allows_morning && s.allows_evening)
      return `${s.duration_minutes_morning} min × 2`;
    return `${s.allows_morning ? s.duration_minutes_morning : s.duration_minutes_evening} min`;
  };

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Sadhana Practices</Text>
          <Text style={s.subtitle}>
            Start a 42-day <Text style={s.mandalaWord}>Mandala</Text> for any practice
          </Text>
        </View>

        {sadhanas?.map(sadhana => {
          const session = sessionLabel(sadhana);
          return (
            <View key={sadhana.id} style={s.card}>
              <View style={s.iconBox}>
                <Text style={{ fontSize: 22 }}>{sadhana.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{sadhana.name}</Text>
                <View style={s.meta}>
                  <Text style={s.metaText}>{durationText(sadhana)} ·</Text>
                  <Text style={[s.badge, { backgroundColor: session.bg, color: session.color }]}>{session.label}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={s.startBtn}
                onPress={() => { setSelected(sadhana); setModalVisible(true); }}
              >
                <Text style={s.startText}>+ Mandala</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 30 }} />
      </ScrollView>

      <StartMandalaModal
        sadhana={selected}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        t={t}
      />
    </View>
  );
}
