import React from 'react';
import { View, StyleSheet } from 'react-native';
import TranslationBot from './TranslationBot';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <View style={styles.container}>
      {children}
      <TranslationBot />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AppLayout; 