import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { useCreateMandala } from '@/hooks/useMandala';
import { useUIStore } from '@/stores/uiStore';
import { COLORS } from '@/utils/colors';

const practiceTypes = ['Meditation', 'Yoga', 'Chanting', 'Reading', 'Morning Routine', 'Custom'];
const targetDays = [40, 21, 30];

export default function NewMandalaScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [practiceType, setPracticeType] = useState('Meditation');
  const [practiceName, setPracticeName] = useState('');
  const [duration, setDuration] = useState(20);
  const [noDuration, setNoDuration] = useState(false);
  const [target, setTarget] = useState(40);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('06:00');
  const [isPublic, setIsPublic] = useState(true);

  const createMandala = useCreateMandala();
  const showToast = useUIStore((s) => s.showToast);

  const canContinue = useMemo(() => {
    if (step === 2) {
      return practiceName.trim().length > 1;
    }
    return true;
  }, [practiceName, step]);

  const submit = async () => {
    try {
      await createMandala.mutateAsync({
        practice_type: practiceType,
        practice_name: practiceName,
        target_days: target,
      });
      showToast('Mandala created. Begin your first day 🔱', 'success');
      router.replace('/(tabs)/home');
    } catch (_e) {
      showToast('Could not create mandala.', 'error');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Create Mandala</Text>
      <Text style={styles.stepLabel}>{`Step ${step} of 6`}</Text>

      {step === 1 ? (
        <View style={styles.group}>
          <Text style={styles.label}>Practice type</Text>
          <View style={styles.wrapRow}>
            {practiceTypes.map((option) => (
              <Choice key={option} label={option} selected={practiceType === option} onPress={() => setPracticeType(option)} />
            ))}
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.group}>
          <Text style={styles.label}>Practice name</Text>
          <TextInput
            value={practiceName}
            onChangeText={setPracticeName}
            placeholder="e.g., Morning Breathwork"
            placeholderTextColor={COLORS.TEXT_MUTED}
            style={styles.input}
          />
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.group}>
          <Text style={styles.label}>Duration {noDuration ? '(No fixed duration)' : `${duration} min`}</Text>
          <View style={styles.row}>
            <Button title="-5" variant="secondary" onPress={() => setDuration((v) => Math.max(5, v - 5))} style={styles.stepBtn} />
            <Button title="+5" variant="secondary" onPress={() => setDuration((v) => Math.min(120, v + 5))} style={styles.stepBtn} />
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.subtle}>No fixed duration</Text>
            <Switch value={noDuration} onValueChange={setNoDuration} />
          </View>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={styles.group}>
          <Text style={styles.label}>Target days</Text>
          <View style={styles.wrapRow}>
            {targetDays.map((option) => (
              <Choice
                key={option}
                label={option === 40 ? '40 (recommended)' : `${option}`}
                selected={target === option}
                onPress={() => setTarget(option)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 5 ? (
        <View style={styles.group}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Reminder enabled</Text>
            <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
          </View>
          <TextInput
            editable={reminderEnabled}
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="HH:MM"
            placeholderTextColor={COLORS.TEXT_MUTED}
            style={[styles.input, !reminderEnabled && { opacity: 0.5 }]}
          />
        </View>
      ) : null}

      {step === 6 ? (
        <View style={styles.group}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Public mandala</Text>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>
          <Text style={styles.subtle}>{isPublic ? 'Others can discover your practice.' : 'Only visible to you.'}</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        {step > 1 ? <Button title="Back" variant="ghost" onPress={() => setStep((s) => s - 1)} /> : null}
        {step < 6 ? (
          <Button title="Continue" onPress={() => setStep((s) => s + 1)} disabled={!canContinue} />
        ) : (
          <Button title="🔱 Begin Mandala" onPress={submit} loading={createMandala.isPending} />
        )}
      </View>
    </ScrollView>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={styles.choiceText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND
  },
  content: {
    padding: 16,
    gap: 16
  },
  header: {
    color: COLORS.TEXT,
    fontSize: 24,
    fontWeight: '700'
  },
  stepLabel: {
    color: COLORS.TEXT_MUTED
  },
  group: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A4E',
    padding: 14,
    gap: 12
  },
  label: {
    color: COLORS.TEXT,
    fontWeight: '700'
  },
  subtle: {
    color: COLORS.TEXT_MUTED
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  choice: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#232344'
  },
  choiceSelected: {
    backgroundColor: COLORS.PRIMARY
  },
  choiceText: {
    color: COLORS.TEXT,
    fontWeight: '600'
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A4E',
    backgroundColor: '#232344',
    color: COLORS.TEXT,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  row: {
    flexDirection: 'row',
    gap: 10
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  stepBtn: {
    minWidth: 80
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});
