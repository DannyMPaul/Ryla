import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './app/(tabs)/Home';
import AuthScreen from './app/(tabs)/index';
import TabNavigator from './app/(tabs)/TabNavigator';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Stack screen for Auth (you can push this on top of tabs) */}
        <Stack.Screen name="AuthScreen" component={AuthScreen} />

        {/* Main screen with bottom tab navigation */}
        <Stack.Screen name="TabNavigator" component={TabNavigator} />
        <TabNavigator />
        {/* Additional stack screens (like Home, if needed) */}
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
