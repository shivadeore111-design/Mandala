import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useProfile } from '@/hooks/useMandala';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { data: profile, isLoading } = useProfile();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Seeker';
  const initials = getInitials(displayName);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F1A', paddingHorizontal: 24, paddingTop: 60 }}>
      <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 24, marginBottom: 36 }}>
        Profile
      </Text>

      {isLoading ? (
        <ActivityIndicator color="#7F77DD" />
      ) : (
        <>
          {/* Avatar */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#7F77DD',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 26 }}>{initials}</Text>
            </View>
            <Text style={{ color: '#F5F5F5', fontWeight: '700', fontSize: 20 }}>{displayName}</Text>
            <Text style={{ color: '#8888AA', fontSize: 14, marginTop: 4 }}>{user?.email}</Text>
            {profile?.created_at ? (
              <Text style={{ color: '#555577', fontSize: 12, marginTop: 6 }}>
                Member since {formatDate(profile.created_at)}
              </Text>
            ) : null}
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
            <View style={{ flex: 1, backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#AFA9EC', fontWeight: '800', fontSize: 26 }}>
                {profile?.total_mandalas_completed ?? 0}
              </Text>
              <Text style={{ color: '#8888AA', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                Mandalas completed
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#AFA9EC', fontWeight: '800', fontSize: 26 }}>
                {profile?.longest_streak ?? 0}
              </Text>
              <Text style={{ color: '#8888AA', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                🔥 Longest streak
              </Text>
            </View>
          </View>

          {/* Sign out */}
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              backgroundColor: '#1A1A2E',
              borderRadius: 14,
              padding: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#2A2A3E',
            }}
          >
            <Text style={{ color: '#F44336', fontWeight: '600', fontSize: 15 }}>Sign Out</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
