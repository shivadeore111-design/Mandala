import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export async function requestNotificationPermissions() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

function parseTime(time: string) {
  const [hourStr = '6', minuteStr = '0'] = time.split(':');
  return {
    hour: Number(hourStr),
    minute: Number(minuteStr)
  };
}

export async function scheduleCheckinReminder(mandalaId: string, time: string) {
  const granted = await requestNotificationPermissions();
  if (!granted) {
    return;
  }

  await cancelReminder(mandalaId);
  const { hour, minute } = parseTime(time);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Mandala Check-In',
      body: 'It is time to continue your practice today.',
      data: { mandalaId }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute
    }
  });
}

export async function cancelReminder(mandalaId: string) {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  const matches = notifications.filter(
    (item: Notifications.NotificationRequest) => item.content.data?.mandalaId === mandalaId
  );

  await Promise.all(
    matches.map((item: Notifications.NotificationRequest) => Notifications.cancelScheduledNotificationAsync(item.identifier))
  );
}
