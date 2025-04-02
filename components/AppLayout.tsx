import React from 'react';
import { View, StyleSheet } from 'react-native';
import TranslationBot from './TranslationBot';
import { usePathname } from 'expo-router';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const pathname = usePathname();
  
  // Don't show TranslationBot on the index page
  const shouldShowTranslationBot = pathname !== '/';

  return (
    <View style={styles.container}>
      {children}
      {shouldShowTranslationBot && <TranslationBot />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AppLayout; 