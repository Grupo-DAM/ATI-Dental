import React from 'react';
import { ScrollView } from 'react-native';

import { VoiceCommandDemo } from '@/components/voice-command-demo';

export default function VoiceDemoScreen() {
  return (
    <ScrollView>
      <VoiceCommandDemo />
    </ScrollView>
  );
}
