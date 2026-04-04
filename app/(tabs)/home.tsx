import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useMandalas, useCheckIn, useProfile, flushOfflineQueue, Mandala } from '@/hooks/useMandala';
import { usePushNotifications } from '@/hooks/usePushNotifications';

function isCheckedInToday(lastCheckinAt: string | null): boolean {
  if (!lastCheckinAt) return false;
  const today = new Date().toISOString().split('T')[0];
  return lastCheckinAt.split('T')[0] === today;
}

function MandalaCard({ mandala }: { mandala: Mandala }) {
  const checkIn = useCheckIn();
  const checkedIn = isCheckedInToday(mandala.last_checkin_at);
  const progress = mandala.target_days > 0 ? mandala.completed_days / mandala.target_days : 0;

  return (
    <View
      style={{
        backgroundColor: '#1A1A2E',
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 16 }}>
            {mandala.practice_name}
          </Text>
          <Text style={{ color: '#8888AA', fontSize: 13, marginTop: 2 }}>
            {mandala.practice_type}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 18 }}>🔥</Text>
          <Text style={{ color: '#AFA9EC', fontWeight: '700', fontSize: 15 }}>
            {mandala.current_streak}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 14, marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: '#8888AA', fontSize: 12 }}>
            Day {mandala.completed_days} of {mandala.target_days}
          </Text>
          <Text style={{ color: '#8888AA', fontSize: 12 }}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
        <View style={{ backgroundColor: '#0F0F1A', borderRadius: 4, height: 6 }}>
          <View
            style={{
              backgroundColor: '#7F77DD',
              borderRadius: 4,
              height: 6,
              width: `${Math.min(progress * 100, 100)}%`,
            }}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={() => checkIn.mutate(mandala)}
        disabled={checkedIn || checkIn.isPending}
        style={{
          backgroundColor: checkedIn ? '#2A2A3E' : '#7F77DD',
          borderRadius: 10,
          padding: 12,
          alignItems: 'center',
          marginTop: 4,
        }}
      >
        {checkIn.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={{ color: checkedIn ? '#555577' : '#fff', fontWeight: '600', fontSize: 14 }}>
            {checkedIn ? '✓ Checked in today' : 'Check In'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfile();
  const { data: mandalas, isLoading, refetch, isRefetching } = useMandalas();

  usePushNotifications();

  useEffect(() => {
    flushOfflineQueue();
  }, []);

  const totalStreakDays = mandalas?.reduce((sum, m) => sum + m.current_streak, 0) ?? 0;
  const activeCount = mandalas?.length ?? 0;
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Seeker';

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F1A' }}>
      <FlatList
        data={mandalas ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#7F77DD"
          />
        }
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 }}>
            <Text style={{ color: '#8888AA', fontSize: 14 }}>Good day,</Text>
            <Text style={{ color: '#F5F5F5', fontSize: 26, fontWeight: '700', marginBottom: 24 }}>
              {displayName} 🙏
            </Text>

            {/* Stat cards */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
              <View style={{ flex: 1, backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: '#AFA9EC' }}>
                  {totalStreakDays}
                </Text>
                <Text style={{ color: '#8888AA', fontSize: 13, marginTop: 2 }}>
                  🔥 Total streak days
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: '#AFA9EC' }}>
                  {activeCount}
                </Text>
                <Text style={{ color: '#8888AA', fontSize: 13, marginTop: 2 }}>
                  🔱 Active mandalas
                </Text>
              </View>
            </View>

            <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 18, marginBottom: 12 }}>
              Today's practice
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <MandalaCard mandala={item} />
          </View>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <ActivityIndicator color="#7F77DD" />
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingHorizontal: 40, paddingTop: 20 }}>
              <Text style={{ fontSize: 40, marginBottom: 16 }}>🌱</Text>
              <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 18, textAlign: 'center' }}>
                Start your first mandala
              </Text>
              <Text style={{ color: '#8888AA', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                A mandala is a 40-day commitment to a spiritual practice.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/mandalas')}
                style={{
                  backgroundColor: '#7F77DD',
                  borderRadius: 12,
                  paddingVertical: 14,
                  paddingHorizontal: 28,
                  marginTop: 24,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                  Create a Mandala
                </Text>
              </TouchableOpacity>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}
