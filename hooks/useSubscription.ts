import type { SubscriptionTier } from '@/lib/revenue-cat';

export function useSubscription() {
  const tier: SubscriptionTier = 'free';
  const isSeeker = false;
  const isGuide = false;

  return {
    data: tier,
    isLoading: false,
    error: null,
    tier,
    isSeeker,
    isGuide,
    isPremium: isSeeker || isGuide,
  };
}
