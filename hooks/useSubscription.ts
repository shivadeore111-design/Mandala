import { useQuery } from '@tanstack/react-query';

import { SubscriptionTier } from '@/lib/revenue-cat';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export function useSubscription() {
  const { user } = useAuthStore();

  const query = useQuery({
    queryKey: ['subscription', user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return (data.subscription_tier as SubscriptionTier) ?? 'free';
    }
  });

  const tier = query.data ?? 'free';
  const isSeeker = tier === 'seeker';
  const isGuide = tier === 'guide';

  return {
    ...query,
    tier,
    isSeeker,
    isGuide,
    isPremium: isSeeker || isGuide
  };
}
