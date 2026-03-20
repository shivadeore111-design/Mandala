import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/utils/colors';
import { getMoonPhase } from '@/utils/moonPhase';

type SpiritualEvent = {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  significance: string;
  recommended_practices: string[];
};

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

  const eventsQuery = useQuery({
    queryKey: ['spiritual-events', monthDate.getFullYear(), monthDate.getMonth()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spiritual_events')
        .select('id, title, event_date, event_type, significance, recommended_practices')
        .gte('event_date', start.toISOString().slice(0, 10))
        .lte('event_date', end.toISOString().slice(0, 10))
        .order('event_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as SpiritualEvent[];
    }
  });

  const checkinsQuery = useQuery({
    queryKey: ['calendar-checkins', monthDate.getFullYear(), monthDate.getMonth()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandala_checkins')
        .select('checkin_date')
        .gte('checkin_date', start.toISOString().slice(0, 10))
        .lte('checkin_date', end.toISOString().slice(0, 10));
      if (error) throw error;
      return new Set((data ?? []).map((row) => row.checkin_date));
    }
  });

  const monthEventsByDate = useMemo(() => {
    const map: Record<string, SpiritualEvent[]> = {};
    for (const event of eventsQuery.data ?? []) {
      if (!map[event.event_date]) map[event.event_date] = [];
      map[event.event_date].push(event);
    }
    return map;
  }, [eventsQuery.data]);

  const days = useMemo(() => {
    const firstWeekday = start.getDay();
    const count = end.getDate();
    return Array.from({ length: firstWeekday + count }, (_, idx) => {
      if (idx < firstWeekday) return null;
      return new Date(monthDate.getFullYear(), monthDate.getMonth(), idx - firstWeekday + 1);
    });
  }, [start, end, monthDate]);

  const selectedEvents = selectedDate ? monthEventsByDate[selectedDate] ?? [] : [];
  const moon = getMoonPhase();

  const upcomingQuery = useQuery({
    queryKey: ['upcoming-events', monthDate.toISOString().slice(0, 10)],
    queryFn: async () => {
      const today = new Date();
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      const { data, error } = await supabase
        .from('spiritual_events')
        .select('id, title, event_date, event_type')
        .gte('event_date', today.toISOString().slice(0, 10))
        .lte('event_date', in30.toISOString().slice(0, 10))
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    }
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.title}>Moon Phase</Text>
        <Text style={styles.moon}>{moon.emoji} {moon.phase}</Text>
        <Text style={styles.meta}>Illumination {moon.illumination}% · Full in {moon.daysUntilFull}d · New in {moon.daysUntilNew}d</Text>
      </Card>

      <View style={styles.monthHeader}>
        <Pressable onPress={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}><Text style={styles.link}>‹ Prev</Text></Pressable>
        <Text style={styles.title}>{monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
        <Pressable onPress={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}><Text style={styles.link}>Next ›</Text></Pressable>
      </View>

      <View style={styles.weekRow}>{WEEK_DAYS.map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}</View>
      <View style={styles.grid}>
        {days.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={styles.dayCell} />;
          const key = day.toISOString().slice(0, 10);
          const events = monthEventsByDate[key] ?? [];
          const checkIn = checkinsQuery.data?.has(key);
          return (
            <Pressable key={key} style={[styles.dayCell, checkIn && { borderColor: '#4CAF50' }]} onPress={() => setSelectedDate(key)}>
              <Text style={styles.dayText}>{day.getDate()}</Text>
              <View style={styles.dotRow}>
                {events.slice(0, 2).map((event) => <View key={event.id} style={[styles.dot, { backgroundColor: eventColor(event.event_type) }]} />)}
                {checkIn ? <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.title}>Upcoming Events (30 days)</Text>
      {(upcomingQuery.data ?? []).map((event) => (
        <Card key={event.id}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.meta}>{event.event_date} · {event.event_type}</Text>
        </Card>
      ))}

      <Modal visible={Boolean(selectedDate)} transparent animationType="slide" onRequestClose={() => setSelectedDate(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedDate(null)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.title}>{selectedDate}</Text>
            {selectedEvents.length ? selectedEvents.map((event) => (
              <Card key={event.id} style={{ marginBottom: 8 }}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.meta}>{event.significance || 'No significance added yet.'}</Text>
                <Text style={styles.meta}>Recommended:</Text>
                {(event.recommended_practices ?? []).map((practice) => <Text key={practice} style={styles.practice}>• {practice}</Text>)}
                <Pressable onPress={() => setReminders((prev) => ({ ...prev, [event.id]: !prev[event.id] }))}>
                  <Text style={styles.link}>{reminders[event.id] ? '✅ Added to reminder' : 'Add to reminder'}</Text>
                </Pressable>
              </Card>
            )) : <Text style={styles.meta}>No events on this date.</Text>}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function eventColor(type: string) {
  if (type === 'pournami') return '#F4D03F';
  if (type === 'amavasya') return '#212121';
  if (type === 'ekadashi') return '#3498DB';
  if (type === 'festival' || type === 'mahashivratri') return '#E74C3C';
  return '#95A5A6';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { padding: 14, gap: 12, paddingBottom: 28 },
  title: { color: COLORS.TEXT, fontWeight: '700', fontSize: 18 },
  moon: { color: COLORS.TEXT, fontSize: 20, marginTop: 4 },
  meta: { color: COLORS.TEXT_MUTED, marginTop: 4 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: COLORS.PRIMARY, fontWeight: '600' },
  weekRow: { flexDirection: 'row' },
  weekDay: { flex: 1, textAlign: 'center', color: COLORS.ACCENT, paddingBottom: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', minHeight: 56, borderWidth: 1, borderColor: '#2A2A4E', padding: 4 },
  dayText: { color: COLORS.TEXT, textAlign: 'center' },
  dotRow: { flexDirection: 'row', justifyContent: 'center', gap: 3, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  eventTitle: { color: COLORS.TEXT, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' },
  sheet: { backgroundColor: COLORS.SURFACE, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '70%' },
  practice: { color: COLORS.TEXT, marginTop: 2 }
});
