import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { useCheckIn } from '@/hooks/useMandala';
import { useUIStore } from '@/stores/uiStore';
import { MandalaMood } from '@/types/mandala';
import { COLORS } from '@/utils/colors';

type CheckInModalProps = {
  visible: boolean;
  mandalaId: string;
  onClose: () => void;
};

const moods: { label: string; value: MandalaMood; emoji: string }[] = [
  { label: 'Restless', value: 'restless', emoji: '😵' },
  { label: 'Dull', value: 'dull', emoji: '😶' },
  { label: 'Neutral', value: 'neutral', emoji: '😐' },
  { label: 'Calm', value: 'calm', emoji: '🙂' },
  { label: 'Blissful', value: 'blissful', emoji: '✨' }
];

export function CheckInModal({ visible, mandalaId, onClose }: CheckInModalProps) {
  const [duration, setDuration] = useState(20);
  const [quality, setQuality] = useState(4);
  const [before, setBefore] = useState<MandalaMood>('neutral');
  const [after, setAfter] = useState<MandalaMood>('calm');
  const [notes, setNotes] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const checkIn = useCheckIn();
  const showToast = useUIStore((s) => s.showToast);

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  const submit = async () => {
    try {
      await checkIn.mutateAsync({ id: mandalaId });
      setCelebrate(true);
      showToast('Check-in complete ✓', 'success');
      setTimeout(() => {
        setCelebrate(false);
        onClose();
      }, 750);
    } catch (_e) {
      showToast('Already checked in today or could not save.', 'error');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Daily Check-In</Text>
          {celebrate ? <Text style={styles.celebrate}>🎉 Beautiful consistency!</Text> : null}

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.label}>Duration: {duration} min</Text>
            <View style={styles.row}>
              <Button title="-5" variant="secondary" onPress={() => setDuration((v) => Math.max(5, v - 5))} style={styles.smallBtn} />
              <Button title="+5" variant="secondary" onPress={() => setDuration((v) => Math.min(120, v + 5))} style={styles.smallBtn} />
            </View>

            <Text style={styles.label}>Quality</Text>
            <View style={styles.row}>
              {stars.map((star) => (
                <Pressable key={star} onPress={() => setQuality(star)}>
                  <Text style={styles.star}>{star <= quality ? '⭐' : '☆'}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Mood before</Text>
            <MoodRow selected={before} onSelect={setBefore} />

            <Text style={styles.label}>Mood after</Text>
            <MoodRow selected={after} onSelect={setAfter} />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
              placeholder="How was your practice today?"
              placeholderTextColor={COLORS.TEXT_MUTED}
            />
          </ScrollView>

          <Button title="Complete Check-In ✓" onPress={submit} loading={checkIn.isPending} />
        </View>
      </View>
    </Modal>
  );
}

function MoodRow({ selected, onSelect }: { selected: MandalaMood; onSelect: (value: MandalaMood) => void }) {
  return (
    <View style={styles.row}>
      {moods.map((mood) => (
        <Pressable
          key={mood.value}
          onPress={() => onSelect(mood.value)}
          style={[styles.moodChip, selected === mood.value && styles.moodSelected]}
        >
          <Text>{mood.emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  sheet: {
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '86%',
    gap: 12
  },
  title: {
    color: COLORS.TEXT,
    fontSize: 20,
    fontWeight: '700'
  },
  celebrate: {
    color: COLORS.SUCCESS,
    fontWeight: '700'
  },
  content: { gap: 12, paddingBottom: 8 },
  label: {
    color: COLORS.TEXT,
    fontWeight: '600'
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  smallBtn: {
    minWidth: 72
  },
  star: {
    fontSize: 24
  },
  moodChip: {
    backgroundColor: '#252545',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  moodSelected: {
    borderColor: COLORS.PRIMARY,
    borderWidth: 1
  },
  input: {
    backgroundColor: '#252545',
    color: COLORS.TEXT,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top'
  }
});
