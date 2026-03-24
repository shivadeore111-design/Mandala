export type SubscriptionTier = 'free' | 'seeker' | 'guide';
export type SubscriptionStatus = { isPro: boolean; productId: string | null; expiresAt: string | null };

export const initRevenueCat = async (): Promise<void> => {};
export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => ({ isPro: false, productId: null, expiresAt: null });
export const getOfferings = async () => ({ current: { availablePackages: [] as any[] } });
export const purchasePackage = async (_pkg?: any, _userId?: string): Promise<SubscriptionTier> => 'free';
export const purchasePro = async (): Promise<boolean> => false;
export const restorePurchases = async (_userId?: string): Promise<boolean> => false;
