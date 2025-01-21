import { Stack } from 'expo-router';
import { NavigationContainer } from '@react-navigation/native';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
