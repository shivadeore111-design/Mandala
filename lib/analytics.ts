import Constants from 'expo-constants';

type EventName =
  | 'app_opened'
  | 'mandala_created'
  | 'mandala_checkin'
  | 'mandala_completed'
  | 'mandala_broken'
  | 'post_created'
  | 'circle_joined'
  | 'challenge_joined'
  | 'card_shared'
  | 'subscription_started'
  | 'journal_entry_created';

let sentryEnabled = false;
let posthogEnabled = false;

export function initAnalytics() {
  sentryEnabled = false;
  posthogEnabled = false;

  if (__DEV__) {
    console.log('[analytics] init', {
      sentryEnabled,
      posthogEnabled,
      appVersion: Constants.expoConfig?.version,
    });
  }
}

export function captureEvent(event: EventName, properties?: Record<string, unknown>) {
  if (__DEV__) console.log('[analytics:event]', event, properties ?? {});
}

export function withErrorBoundary<T>(render: () => T): T {
  try {
    return render();
  } catch (error) {
    console.error('[analytics:error_boundary]', error);
    throw error;
  }
}
