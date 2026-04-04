import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    async function setup() {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;

      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7F77DD',
        });
      }

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        await supabase
          .from('profiles')
          .update({ push_token: tokenData.data })
          .eq('id', user!.id);
      } catch {
        // Push token not required to proceed
      }
    }

    setup();
  }, [user]);
}
