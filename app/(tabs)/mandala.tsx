import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Mandala } from '@/types';
import Svg, { Circle, Line, G } from 'react-native-svg';

function BraunTimer({ mandala, visible, onClose, t }: { mandala: Mandala; visible: boolean; onClose: () => void; t: any }) {
  const duration = (mandala.sadhana?.duration_minutes_morning || 21) * 60;
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0; }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const elapsed = duration - remaining;
  const pct = elapsed / duration;
  const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');
  const elapsedMins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const elapsedSecs = (elapsed % 60).toString().padStart(2, '0');

  const r = 74;
  const circ = 2 * Math.PI * r;
  const ticks = Array.from({ length: 60 }, (_, i) => i * 6);

  const reset = () => { setRemaining(duration); setRunning(false); };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: t.bg, padding: 24 }}>

        <TouchableOpacity onPress={onClose} style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 14, color: t.text3 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: '800', color: t.text, textAlign: 'center', marginBottom: 2 }}>
          {mandala.sadhana?.name || mandala.practice_name}
        </Text>
        <Text style={{ fontSize: 12, color: t.text3, textAlign: 'center', marginBottom: 12 }}>
          Morning Session · Day {mandala.completed_days + 1} of {mandala.mandala_days}
        </Text>

        <View style={{
          alignSelf: 'center', borderRadius: 999,
          backgroundColor: t.bg,
          shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4,
          paddingHorizontal: 20, paddingVertical: 6, marginBottom: 20,
        }}>
          <Text style={{ fontSize: 11, color: t.red, fontWeight: '700', letterSpacing: 1 }}>
            MANDALA DAY {mandala.completed_days + 1}
          </Text>
        </View>

        {/* BRAUN DIAL */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{
            width: 220, height: 220, borderRadius: 110,
            backgroundColor: t.bg,
            shadowColor: t.shadowDark, shadowOffset: { width: 8, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 12,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <View style={{
              width: 196, height: 196, borderRadius: 98,
              backgroundColor: t.surface,
              shadowColor: t.shadowDark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 6,
              alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <Svg width={196} height={196} style={{ position: 'absolute' }}>
                <G transform="translate(98, 98)">
                  {ticks.map(angle => {
                    const isMajor = angle % 18 === 0;
                    const rad = (angle - 90) * Math.PI / 180;
                    const inner = isMajor ? 82 : 86;
                    const outer = 92;
                    return (
                      <Line key={angle}
                        x1={Math.cos(rad) * inner} y1={Math.sin(rad) * inner}
                        x2={Math.cos(rad) * outer} y2={Math.sin(rad) * outer}
                        stroke={t.border} strokeWidth={isMajor ? 1.5 : 0.8}
                      />
                    );
                  })}
                  <Circle cx={0} cy={0} r={r} fill="none" stroke={t.border} strokeWidth={6} />
                  <Circle cx={0} cy={0} r={r} fill="none" stroke={t.red} strokeWidth={2.5}
                    strokeDasharray={`${circ * pct} ${circ}`}
                    strokeLinecap="round" transform="rotate(-90)" opacity={0.8}
                  />
                  <Line x1={0} y1={-68} x2={0} y2={-54} stroke={t.red} strokeWidth={2.5} strokeLinecap="round" />
                  <Circle cx={0} cy={-50} r={3.5} fill={t.red} />
                </G>
              </Svg>

              {/* LCD face */}
              <View style={{
                width: 130, height: 130, borderRadius: 65,
                backgroundColor: t.lcdBg,
                shadowColor: t.shadowDark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 6,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: t.lcdText, fontFamily: 'Courier New', letterSpacing: -1 }}>
                  {mins}:{secs}
                </Text>
                <Text style={{ fontSize: 8, color: t.lcdText, letterSpacing: 2, opacity: 0.7, marginTop: 3 }}>REMAINING</Text>
                <Text style={{ fontSize: 8, color: t.orange, fontWeight: '700', letterSpacing: 1, marginTop: 2 }}>
                  {(mandala.sadhana?.name || '').toUpperCase().slice(0, 9)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CONTROLS */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <TouchableOpacity onPress={reset} style={{
            width: 52, height: 52, borderRadius: 14, backgroundColor: t.bg,
            shadowColor: t.shadowDark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 6,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 20, color: t.orange }}>⏮</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRunning(r => !r)} style={{
            width: 64, height: 64, borderRadius: 18, backgroundColor: t.bg,
            shadowColor: t.shadowDark, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 12, elevation: 8,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 26, color: t.orange }}>{running ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{
            width: 52, height: 52, borderRadius: 14, backgroundColor: t.bg,
            shadowColor: t.shadowDark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 10, elevation: 6,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 20, color: t.orange }}>⏭</Text>
          </TouchableOpacity>
        </View>

        {/* PROGRESS BAR */}
        <View style={{ paddingHorizontal: 4, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 10, color: t.text3, letterSpacing: 1 }}>START</Text>
            <Text style={{ fontSize: 10, color: t.orange, fontWeight: '700', letterSpacing: 1 }}>{Math.round(pct * 100)}% COMPLETE</Text>
            <Text style={{ fontSize: 10, color: t.text3, letterSpacing: 1 }}>END</Text>
          </View>
          <View style={{
            height: 32, backgroundColor: t.surface, borderRadius: 8,
            shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8,
            justifyContent: 'center', overflow: 'hidden',
          }}>
            <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct * 100}%`, backgroundColor: t.orangeBg, borderRadius: 8 }} />
            <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 8, alignItems: 'center' }}>
              {Array.from({ length: 28 }, (_, i) => (
                <View key={i} style={{ width: 1, backgroundColor: t.border, height: i % 4 === 0 ? 18 : 10 }} />
              ))}
            </View>
            <View style={{
              position: 'absolute', left: `${pct * 100}%`, top: '50%',
              width: 8, height: 24, backgroundColor: t.bg, borderRadius: 4,
              marginTop: -12,
              shadowColor: t.shadowDark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 4,
            }} />
          </View>
        </View>

        {/* STATS */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { label: 'Elapsed', value: `${elapsedMins}:${elapsedSecs}`, color: t.text },
            { label: 'Remaining', value: `${mins}:${secs}`, color: t.red },
            { label: 'Total', value: `${Math.floor(duration / 60)}:00`, color: t.text },
          ].map(stat => (
            <View key={stat.label} style={{
              flex: 1, alignItems: 'center', padding: 12, backgroundColor: t.bg, borderRadius: 14,
              shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: stat.color }}>{stat.value}</Text>
              <Text style={{ fontSize: 9, color: t.text3, marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

      </View>
    </Modal>
  );
}

export default function MandalaScreen() {
  const t = useTheme();
  const { user } = useAuthStore();
  const [timerMandala, setTimerMandala] = useState<Mandala | null>(null);

  const { data: mandalas } = useQuery<Mandala[]>({
    queryKey: ['mandalas', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('mandalas')
        .select('*, sadhana:sadhanas(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const active = mandalas?.filter(m => m.status === 'active') || [];
  const completed = mandalas?.filter(m => m.status === 'completed') || [];

  const pctOf = (m: Mandala) => Math.round((m.completed_days / (m.mandala_days || 42)) * 100);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>

        <Text style={{ fontSize: 22, fontWeight: '800', color: t.text, marginBottom: 4 }}>My Mandalas</Text>
        <Text style={{ fontSize: 13, color: t.text3, marginBottom: 20 }}>42-day sadhana commitments</Text>

        {active.length > 0 && (
          <>
            <Text style={{ fontSize: 10, fontWeight: '700', color: t.text3, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Active</Text>
            {active.map(m => (
              <TouchableOpacity key={m.id} onPress={() => setTimerMandala(m)} style={{
                backgroundColor: t.bg, borderRadius: 18, padding: 18, marginBottom: 12,
                shadowColor: t.shadowDark, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 12, elevation: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <Text style={{ fontSize: 24 }}>{m.sadhana?.icon || '📿'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: t.text }}>{m.sadhana?.name || m.practice_name}</Text>
                    <Text style={{ fontSize: 12, color: t.text3 }}>Day {m.completed_days} of {m.mandala_days || 42}</Text>
                  </View>
                  <View style={{
                    backgroundColor: t.orangeBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
                    borderWidth: 1, borderColor: t.orange,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: t.orange }}>{pctOf(m)}%</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={{
                  height: 8, backgroundColor: t.surface, borderRadius: 4,
                  shadowColor: t.shadowDark, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 4, overflow: 'hidden',
                }}>
                  <View style={{ width: `${pctOf(m)}%`, height: '100%', backgroundColor: t.orange, borderRadius: 4 }} />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text style={{ fontSize: 11, color: t.text3 }}>Started {new Date(m.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                  <Text style={{ fontSize: 11, color: t.orange, fontWeight: '700' }}>▶ Start Session</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {completed.length > 0 && (
          <>
            <Text style={{ fontSize: 10, fontWeight: '700', color: t.text3, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 }}>Completed</Text>
            {completed.map(m => (
              <View key={m.id} style={{
                backgroundColor: t.bg, borderRadius: 16, padding: 16, marginBottom: 10,
                shadowColor: t.shadowDark, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4,
                opacity: 0.8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 22 }}>{m.sadhana?.icon || '📿'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: t.text }}>{m.sadhana?.name || m.practice_name}</Text>
                    <Text style={{ fontSize: 12, color: t.green }}>✓ Completed 42 days</Text>
                  </View>
                  <Text style={{ fontSize: 20 }}>🏆</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {(!mandalas || mandalas.length === 0) && (
          <View style={{
            alignItems: 'center', padding: 40, backgroundColor: t.bg, borderRadius: 20,
            shadowColor: t.shadowDark, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 12, elevation: 8,
          }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📿</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: t.text, marginBottom: 6 }}>No Mandalas Yet</Text>
            <Text style={{ fontSize: 13, color: t.text3, textAlign: 'center' }}>Go to Sadhana tab to start your first 42-day journey</Text>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {timerMandala && (
        <BraunTimer
          mandala={timerMandala}
          visible={!!timerMandala}
          onClose={() => setTimerMandala(null)}
          t={t}
        />
      )}
    </View>
  );
}
