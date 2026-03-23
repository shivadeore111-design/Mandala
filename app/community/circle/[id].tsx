import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { COLORS } from '@/utils/colors';

export default function CircleDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();

  const membersQuery = useQuery({
    queryKey: ['circle-members', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('circle_members').select('user_id').eq('circle_id', id);
      if (error) throw error;
      return data ?? [];
    }
  });

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.name}>{name ?? 'Circle'}</Text>
        <Text style={styles.meta}>Members: {membersQuery.data?.length ?? 0}</Text>
        <Text style={styles.meta}>Circle detail experience is a placeholder for now.</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND, padding: 16 },
  name: { color: COLORS.TEXT, fontSize: 22, fontWeight: '700' },
  meta: { color: COLORS.TEXT_MUTED, marginTop: 6 }
});
