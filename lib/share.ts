import { RefObject } from 'react';
import { Share } from 'react-native';

import { captureEvent } from '@/lib/analytics';

export async function captureAndShare(viewRef: RefObject<unknown>, fallbackMessage: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const viewShotModule = require('react-native-view-shot');
    const uri = await viewShotModule.captureRef(viewRef, { format: 'png', quality: 0.95 });
    await Share.share({ url: uri, message: fallbackMessage });
  } catch (_error) {
    await Share.share({ message: fallbackMessage });
  }

  captureEvent('card_shared', { source: fallbackMessage });
}
