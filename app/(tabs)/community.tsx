import { Text, View } from 'react-native';

import { COLORS } from '@/utils/colors';

export default function CommunityScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.BACKGROUND }}>
      <Text style={{ color: COLORS.TEXT }}>Community Screen</Text>
    </View>
  );
}
