import { Text, View } from 'react-native';

import { COLORS } from '@/utils/colors';

export default function ChallengesScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.BACKGROUND }}>
      <Text style={{ color: COLORS.TEXT }}>Challenges Screen</Text>
    </View>
  );
}
