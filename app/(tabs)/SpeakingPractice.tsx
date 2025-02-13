import React from 'react';
import { View } from 'react-native';
import SpeechPractice from '../../components/SpeechPractice';

const SpeakingPracticeScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <SpeechPractice visible={true} onClose={() => {}} />
    </View>
  );
};

export default SpeakingPracticeScreen; 