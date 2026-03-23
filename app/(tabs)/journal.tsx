import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { JournalEntry, DailyContemplation } from '@/types';

const MOODS = [
  { key: 'restless', emoji: '😤', label: 'Restless' },
  { key: 'dull', emoji: '😶', label: 'Dull' },
  { key: 'neutral', emoji: '😐', label: 'Neutral' },
  { key: 'peaceful', emoji: '😌', label: 'Peaceful' },
  { key: 'blissful', emoji: '🌟', label: 'Blissful' },
];

function NewEntryModal({ visible, onClose, prompt, t }: any) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState('neutral');
  const [energy, setEnergy] = useState(3);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!content.trim() || !user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('journal_entries').insert({
        user_id: user.id,
        title,
        content,
        mood,
        energy_level: energy,
        entry_type: prompt ? 'prompted' : 'free',
        prompt_text: prompt || '',
        is_private: true,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['journal'] });
      setContent(''); setTitle(''); setMood('neutral'); setEnergy(3);
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView style={{ flex: 1, backgroundColor: t.bg, padding: 24 }} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onClose} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: t.text3 }}>← Cancel</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 20, fontWeight: '800', color: t.text, marginBottom: 4 }}>New Entry</Text>
        <Text style={{ fontSize: 12, color: t.text3, marginBottom: 20 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {prompt && (
          <View style={{ padding: 14, borderLeftWidth: 3, borderLeftColor: t.gold, borderTopRightRadius: 12, borderBottomRightRadius: 12, backgroundColor: t.surface2, marginBottom: 20 }}>
            <Text style={{ fontSize: 10, color: t.gold, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>TODAY'S PROMPT</Text>
            <Text style={{ fontSize: 13, color: t.text2, lineHeight: 20 }}>{prompt}</Text>
          </View>
        )}

        <Text style={{ fontSize: 11, fontWeight: '700', color: t.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Title (optional)</Text>
        <TextInput
          style={{ backgroundColor: t.surface2, borderRadius: 10, padding: 14, fontSize: 14, color: t.text, marginBottom: 16 }}
          placeholder="Give your entry a title..."
          placeholderTextColor={t.text3}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={{ fontSize: 11, fontWeight: '700', color: t.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Your thoughts</Text>
        <TextInput
          style={{ backgroundColor: t.surface2, borderRadius: 12, padding: 16, fontSize: 14, color: t.text, minHeight: 160, textAlignVertical: 'top', marginBottom: 20 }}
          placeholder="Write freely..."
          placeholderTextColor={t.text3}
          value={content}
          onChangeText={setContent}
          multiline
        />

        <Text style={{ fontSize: 11, fontWeight: '700', color: t.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>How are you feeling?</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {MOODS.map(m => (
            <TouchableOpacity key={m.key} onPress={() => setMood(m.key)} style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
              backgroundColor: mood === m.key ? t.orangeBg : t.surface,
              borderWidth: mood === m.key ? 1.5 : 0,
              borderColor: mood === m.key ? t.orange : 'transparent',
              shadowColor: t.shadowDark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 3,
            }}>
              <Text style={{ fontSize: 16 }}>{m.emoji}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: mood === m.key ? t.orange : t.text2 }}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 11, fontWeight: '700', color: t.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Energy level</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 30 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity key={n} onPress={() => setEnergy(n)} style={{
              flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10,
              backgroundColor: t.bg,
              shadowColor: energy === n ? t.orange : t.shadowDark,
              shadowOffset: { width: energy === n ? 0 : 3, height: energy === n ? 0 : 3 },
              shadowOpacity: 1, shadowRadius: energy === n ? 0 : 8,
              borderWidth: energy === n ? 1.5 : 0,
              borderColor: energy === n ? t.orange : 'transparent',
            }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: energy === n ? t.orange : t.text3 }}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={save} disabled={!content.trim() || loading} style={{
          backgroundColor: t.orange, borderRadius: 14, padding: 16, alignItems: 'center',
          shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4,
          opacity: !content.trim() ? 0.5 : 1,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{loading ? 'Saving...' : 'Save Entry'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Modal>
  );
}

export default function JournalScreen() {
  const t = useTheme();
  const { user } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const { data: contemplation } = useQuery<DailyContemplation>({
    queryKey: ['contemplation', today],
    queryFn: async () => {
      const { data } = await supabase.from('daily_contemplations').select('*').eq('contemplation_date', today).single();
      return data;
    },
  });

  const { data: entries } = useQuery<JournalEntry[]>({
    queryKey: ['journal', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, marginBottom: 2 }}>Journal</Text>
            <Text style={{ fontSize: 12, color: t.text3 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={{
            backgroundColor: t.orange, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
            shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4,
          }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>+ Write</Text>
          </TouchableOpacity>
        </View>

        {contemplation && (
          <TouchableOpacity onPress={() => setModalVisible(true)} style={{
            padding: 16, borderLeftWidth: 3, borderLeftColor: t.gold,
            borderTopRightRadius: 14, borderBottomRightRadius: 14,
            backgroundColor: t.surface2, marginBottom: 20,
          }}>
            <Text style={{ fontSize: 10, color: t.gold, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>TODAY'S PROMPT · TAP TO WRITE</Text>
            <Text style={{ fontSize: 13, color: t.text2, lineHeight: 20, fontStyle: 'italic', marginBottom: 6 }}>
              {contemplation.journal_prompt}
            </Text>
            <Text style={{ fontSize: 11, color: t.orange, fontWeight: '600' }}>Write reflection →</Text>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {MOODS.map(m => (
            <View key={m.key} style={{
              flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: t.bg,
              shadowColor: t.shadowDark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 3,
            }}>
              <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
              <Text style={{ fontSize: 9, color: t.text3, marginTop: 3 }}>{m.label}</Text>
            </View>
          ))}
        </View>

        {entries && entries.length > 0 && (
          <>
            <Text style={{ fontSize: 10, fontWeight: '700', color: t.text3, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Past Entries</Text>
            {entries.map(e => (
              <View key={e.id} style={{
                backgroundColor: t.bg, borderRadius: 14, padding: 16, marginBottom: 10,
                shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: t.text, flex: 1 }}>{e.title || 'Untitled'}</Text>
                  <Text style={{ fontSize: 11, color: t.text3 }}>
                    {new Date(e.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: t.text2, lineHeight: 18 }} numberOfLines={3}>{e.content}</Text>
                {e.mood && (
                  <Text style={{ fontSize: 11, color: t.text3, marginTop: 8 }}>
                    {MOODS.find(m => m.key === e.mood)?.emoji} {e.mood}
                    {e.energy_level ? ` · Energy ${e.energy_level}/5` : ''}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <NewEntryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        prompt={contemplation?.journal_prompt}
        t={t}
      />
    </View>
  );
}
