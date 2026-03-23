import { supabase } from '@/lib/supabase';

export type SubscriptionTier = 'free' | 'seeker' | 'guide';

export async function configureRevenueCat(userId?: string) { return; }
export async function getOfferings() { return { current: null }; }
export async function purchasePackage(pkg: any, userId: string): Promise<SubscriptionTier> { return 'free'; }
export async function restorePurchases(userId: string): Promise<SubscriptionTier> { return 'free'; }
export async function getCustomerInfo() { return {}; }
export function tierFromCustomerInfo(info: any): SubscriptionTier { return 'free'; }
export async function syncTierToProfile(userId: string, tier: SubscriptionTier) { await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', userId); }