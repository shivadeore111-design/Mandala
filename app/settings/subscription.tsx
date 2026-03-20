import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getOfferings, purchasePackage, restorePurchases } from '@/lib/revenue-cat';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { COLORS } from '@/utils/colors';

export default function SubscriptionScreen() {
  const { user } = useAuthStore();
  const { showToast } = useUIStore();
  const queryClient = useQueryClient();

  const offeringsQuery = useQuery({ queryKey: ['offerings'], queryFn: getOfferings });

  const purchase = useMutation({
    mutationFn: async (pkg: any) => purchasePackage(pkg, user!.id),
    onSuccess: async (tier) => {
      showToast(`Upgraded to ${tier}.`, 'success');
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: () => showToast('Purchase failed. Please try again.', 'error')
  });

  const restore = useMutation({
    mutationFn: async () => restorePurchases(user!.id),
    onSuccess: async () => {
      showToast('Purchases restored.', 'success');
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: () => showToast('No purchase to restore.', 'info')
  });

  const packages = offeringsQuery.data?.current?.availablePackages ?? [];
  const seeker = packages.find((p: any) => String(p.identifier).toLowerCase().includes('seeker'));
  const guide = packages.find((p: any) => String(p.identifier).toLowerCase().includes('guide'));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your path</Text>
      <View style={styles.row}>
        <PlanCard
          name="Seeker"
          price={seeker?.product?.priceString ?? '₹199/month'}
          points={[
            'Unlimited mandalas',
            'All circles + full journal',
            'No card watermark',
            'Brahma Muhurta alarm + analytics'
          ]}
          onPress={() => seeker && purchase.mutate(seeker)}
        />
        <PlanCard
          name="Guide"
          price={guide?.product?.priceString ?? '₹499/month'}
          points={[
            'Everything in Seeker',
            'Create circles + satsangs',
            'Monthly live sessions',
            'Priority nearby + exclusive content'
          ]}
          onPress={() => guide && purchase.mutate(guide)}
        />
      </View>
      <Text style={styles.restore} onPress={() => restore.mutate()}>
        Restore Purchases
      </Text>
    </View>
  );
}

function PlanCard({ name, price, points, onPress }: { name: string; price: string; points: string[]; onPress: () => void }) {
  return (
    <Card style={styles.plan}>
      <Text style={styles.planName}>{name}</Text>
      <Text style={styles.price}>{price}</Text>
      {points.map((point) => (
        <Text key={point} style={styles.point}>• {point}</Text>
      ))}
      <Button title={`Get ${name}`} onPress={onPress} />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND, padding: 16, gap: 12 },
  title: { color: COLORS.TEXT, fontSize: 24, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  plan: { flex: 1, gap: 8 },
  planName: { color: COLORS.TEXT, fontWeight: '700', fontSize: 20 },
  price: { color: COLORS.PRIMARY, fontWeight: '700' },
  point: { color: COLORS.TEXT_MUTED, fontSize: 12 },
  restore: { color: COLORS.ACCENT, textAlign: 'center', marginTop: 12, textDecorationLine: 'underline' }
});
