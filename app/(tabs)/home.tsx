import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import Svg, { Circle, Line, G } from 'react-native-svg';
import { Mandala, DailyContemplation, SpiritualEvent, MandalaCheckin } from '@/types';
import { useState } from 'react';

function MandalaDial({ days, total, practiceName, t }: { days: number; total: number; practiceName: string; t: any }) {
  const pct = days / total;
  const r = 62;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference * pct;

  const ticks = Array.from({ length: 60 }, (_, i) => i * 6);

  return (
    <View style={{ alignItems: 'center', marginBottom: 16 }}>
      <View style={{
        width: 180, height: 180, borderRadius: 90,
        backgroundColor: t.bg,
        shadowColor: t.shadowDark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 14, elevation: 10,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <View style={{
          width: 156, height: 156, borderRadius: 78,
          backgroundColor: t.surface,
          shadowColor: t.shadowDark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 6,
          alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <Svg width={156} height={156} style={{ position: 'absolute' }}>
            <G transform="translate(78, 78)">
              {ticks.map((angle) => {
                const isMajor = angle % 18 === 0;
                const rad = (angle - 90) * Math.PI / 180;
                const inner = isMajor ? 66 : 70;
                const outer = 74;
                return (
                  <Line
                    key={angle}
                    x1={Math.cos(rad) * inner} y1={Math.sin(rad) * inner}
                    x2={Math.cos(rad) * outer} y2={Math.sin(rad) * outer}
                    stroke={t.border} strokeWidth={isMajor ? 1.5 : 0.8}
                  />
                );
              })}
              <Circle cx={0} cy={0} r={r} fill="none" stroke={t.border} strokeWidth={5} />
              <Circle cx={0} cy={0} r={r} fill="none" stroke={t.orange} strokeWidth={5}
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90)"
              />
              <Line x1={0} y1={-58} x2={0} y2={-46} stroke={t.red} strokeWidth={2.5} strokeLinecap="round" />
              <Circle cx={0} cy={-42} r={3} fill={t.red} />
            </G>
          </Svg>

          <View style={{
            width: 106, height: 106, borderRadius: 53,
            backgroundColor: t.lcdBg,
            shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 34, fontWeight: '900', color: t.lcdText, fontFamily: 'Courier New', lineHeight: 36 }}>{days}</Text>
            <Text style={{ fontSize: 8, color: t.lcdText, letterSpacing: 2, opacity: 0.7, marginTop: 2 }}>OF {total} DAYS</Text>
            <Text style={{ fontSize: 8, color: t.orange, fontWeight: '700', letterSpacing: 1, marginTop: 2 }}>{practiceName.toUpperCase().slice(0, 10)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function NeoCard({ children, style, t }: any) {
  return (
    <View style={[{
      backgroundColor: t.bg,
      borderRadius: 14,
      padding: 14,
      shadowColor: t.shadowDark,
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 10,
      elevation: 6,
    }, style]}>
      {children}
    </View>
  );
}

function StatCard({ value, label, t }: any) {
  return (
    <NeoCard t={t} style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: t.orange, lineHeight: 22 }}>{value}</Text>
      <Text style={{ fontSize: 9, color: t.text3, marginTop: 2, letterSpacing: 0.5 }}>{label}</Text>
    </NeoCard>
  );
}

export default function HomeScreen() {
  const t = useTheme();
  const { user, profile } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];

  const { data: activeMandala } = useQuery<Mandala>({
    queryKey: ['active-mandala', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('mandalas')
        .select('*, sadhana:sadhanas(*)')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const { data: todayCheckins } = useQuery<MandalaCheckin[]>({
    queryKey: ['today-checkins', user?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from('mandala_checkins')
        .select('*')
        .eq('user_id', user!.id)
        .eq('checkin_date', today);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: contemplation } = useQuery<DailyContemplation>({
    queryKey: ['contemplation', today],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_contemplations')
        .select('*')
        .eq('contemplation_date', today)
        .single();
      return data;
    },
  });

  const { data: events } = useQuery<SpiritualEvent[]>({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('spiritual_events')
        .select('*')
        .gte('event_date', today)
        .order('event_date')
        .limit(3);
      return data || [];
    },
  });

  const handleCheckin = async (session: 'morning' | 'evening') => {
    if (!activeMandala || !user) return;
    const alreadyDone = todayCheckins?.some(c => c.session === session);
    if (alreadyDone) return;

    await supabase.from('mandala_checkins').insert({
      mandala_id: activeMandala.id,
      user_id: user.id,
      checkin_date: today,
      day_number: activeMandala.completed_days + 1,
      session,
      duration_minutes: session === 'morning'
        ? (activeMandala.sadhana?.duration_minutes_morning || 21)
        : (activeMandala.sadhana?.duration_minutes_evening || 21),
    });
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'Seeker';

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    greeting: { fontSize: 12, color: t.text3, marginBottom: 2 },
    title: { fontSize: 20, fontWeight: '800', color: t.text },
    avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: t.goldBg, alignItems: 'center', justifyContent: 'center',
      shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    sectionLabel: { fontSize: 10, fontWeight: '700', color: t.text3, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
    checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, padding: 12,
      backgroundColor: t.bg, borderRadius: 14,
      shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4 },
    checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    checkboxDone: { backgroundColor: t.goldBg, borderColor: t.gold },
    checkLabel: { fontSize: 13, fontWeight: '600', color: t.text, flex: 1 },
    checkSub: { fontSize: 10, color: t.text3, marginTop: 1 },
    badge: { fontSize: 9, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
    contemplationCard: { padding: 14, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: t.gold,
      borderRadius: 0, backgroundColor: t.surface2,
      borderTopRightRadius: 12, borderBottomRightRadius: 12 },
    quote: { fontSize: 13, color: t.text2, lineHeight: 20, fontStyle: 'italic', marginBottom: 4 },
    quoteAttr: { fontSize: 10, color: t.gold },
    eventPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: 999, backgroundColor: t.surface,
      shadowColor: t.shadowDark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 3,
      marginRight: 8, marginBottom: 8 },
    eventDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: t.orange },
    eventText: { fontSize: 11, color: t.orange, fontWeight: '600' },
  });

  const mandala = activeMandala;
  const morningDone = todayCheckins?.some(c => c.session === 'morning');
  const eveningDone = todayCheckins?.some(c => c.session === 'evening');

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Namaskaram, {firstName} 🙏</Text>
            <Text style={s.title}>Today's Sadhana</Text>
          </View>
          <View style={s.avatar}>
            <Text style={{ fontSize: 18 }}>🧘</Text>
          </View>
        </View>

        {mandala ? (
          <MandalaDial
            days={mandala.completed_days}
            total={mandala.mandala_days || 42}
            practiceName={mandala.sadhana?.name || mandala.practice_name}
            t={t}
          />
        ) : (
          <NeoCard t={t} style={{ alignItems: 'center', padding: 24, marginBottom: 16 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📿</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.text, marginBottom: 4 }}>No Active Mandala</Text>
            <Text style={{ fontSize: 12, color: t.text3, textAlign: 'center' }}>Go to Sadhana tab to start your 42-day journey</Text>
          </NeoCard>
        )}

        <View style={s.statsRow}>
          <StatCard value={profile?.total_mandalas_completed || 0} label="Mandalas" t={t} />
          <StatCard value={profile?.current_streak || 0} label="Day Streak" t={t} />
          <StatCard value={profile?.total_practice_days || 0} label="Total Days" t={t} />
        </View>

        {mandala && (
          <>
            <Text style={s.sectionLabel}>Today's Checklist</Text>

            {(mandala.session_type === 'morning' || mandala.session_type === 'both') && (
              <TouchableOpacity style={s.checkRow} onPress={() => handleCheckin('morning')}>
                <View style={[s.checkbox, morningDone && s.checkboxDone]}>
                  {morningDone && <Text style={{ fontSize: 13, color: t.gold, fontWeight: '700' }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.checkLabel}>{mandala.sadhana?.name || mandala.practice_name}</Text>
                  <Text style={s.checkSub}>{mandala.sadhana?.duration_minutes_morning || 21} min · {morningDone ? 'Completed' : 'Pending'}</Text>
                </View>
                <Text style={[s.badge, { backgroundColor: t.goldBg, color: t.gold }]}>Morning</Text>
              </TouchableOpacity>
            )}

            {(mandala.session_type === 'evening' || mandala.session_type === 'both') && (
              <TouchableOpacity style={s.checkRow} onPress={() => handleCheckin('evening')}>
                <View style={[s.checkbox, eveningDone && s.checkboxDone]}>
                  {eveningDone && <Text style={{ fontSize: 13, color: t.gold, fontWeight: '700' }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.checkLabel}>{mandala.sadhana?.name || mandala.practice_name}</Text>
                  <Text style={s.checkSub}>{mandala.sadhana?.duration_minutes_evening || 21} min · {eveningDone ? 'Completed' : 'Pending'}</Text>
                </View>
                <Text style={[s.badge, { backgroundColor: t.terraBg, color: t.terra }]}>Evening</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {contemplation && (
          <>
            <View style={{ height: 16 }} />
            <View style={s.contemplationCard}>
              <Text style={s.quote}>"{contemplation.quote}"</Text>
              <Text style={s.quoteAttr}>Today's contemplation · tap to journal</Text>
            </View>
          </>
        )}

        {events && events.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Upcoming Sacred Dates</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {events.map(ev => {
                const daysUntil = Math.ceil((new Date(ev.event_date).getTime() - Date.now()) / 86400000);
                return (
                  <View key={ev.id} style={s.eventPill}>
                    <View style={s.eventDot} />
                    <Text style={s.eventText}>{ev.title} · {daysUntil}d</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}
