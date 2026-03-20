import { supabase } from '@/lib/supabase';
import { captureEvent } from '@/lib/analytics';

export type SubscriptionTier = 'free' | 'seeker' | 'guide';

type RevenueCatModule = {
  configure: (input: { apiKey: string; appUserID?: string }) => Promise<void> | void;
  getOfferings: () => Promise<any>;
  purchasePackage: (pkg: any) => Promise<{ customerInfo: any }>;
  restorePurchases: () => Promise<any>;
  getCustomerInfo: () => Promise<any>;
};

let purchases: RevenueCatModule | null = null;

function getPurchasesModule(): RevenueCatModule {
  if (purchases) return purchases;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const module = require('react-native-purchases');
  purchases = (module.default ?? module) as RevenueCatModule;
  return purchases;
}

export async function configureRevenueCat(userId?: string) {
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_KEY;
  if (!apiKey) return;

  try {
    getPurchasesModule().configure({ apiKey, appUserID: userId });
  } catch (error) {
    console.warn('RevenueCat unavailable', error);
  }
}

export async function getOfferings() {
  return getPurchasesModule().getOfferings();
}

export async function purchasePackage(pkg: any, userId: string): Promise<SubscriptionTier> {
  const result = await getPurchasesModule().purchasePackage(pkg);
  const tier = tierFromCustomerInfo(result.customerInfo);
  await syncTierToProfile(userId, tier);
  captureEvent('subscription_started', { tier });
  return tier;
}

export async function restorePurchases(userId: string): Promise<SubscriptionTier> {
  const info = await getPurchasesModule().restorePurchases();
  const tier = tierFromCustomerInfo(info);
  await syncTierToProfile(userId, tier);
  return tier;
}

export async function getCustomerInfo() {
  return getPurchasesModule().getCustomerInfo();
}

export function tierFromCustomerInfo(customerInfo: any): SubscriptionTier {
  const active = customerInfo?.entitlements?.active ?? {};
  if (active.guide) return 'guide';
  if (active.seeker) return 'seeker';
  return 'free';
}

export async function syncTierToProfile(userId: string, tier: SubscriptionTier) {
  const { error } = await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', userId);
  if (error) throw error;
}
