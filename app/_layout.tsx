import { Stack } from 'expo-router';
import AppLayout from '../components/AppLayout';

export default function Layout() {
  return (
    <AppLayout>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </AppLayout>
  );
}
