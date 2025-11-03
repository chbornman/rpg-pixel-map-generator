import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from '../screens/MapScreen';
import GalleryScreen from '../screens/GalleryScreen';
import ThemeSelectionScreen from '../screens/ThemeSelectionScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack for Map flow (Map -> Theme Selection)
const MapStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ThemeSelection"
        component={ThemeSelectionScreen}
        options={{
          title: 'Select Theme',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
};

// Main bottom tab navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            display: 'none',
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="MapTab"
          component={MapStack}
          options={{
            tabBarLabel: 'Capture',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>📸</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Gallery"
          component={GalleryScreen}
          options={{
            tabBarLabel: 'Gallery',
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>🖼️</Text>
            ),
            headerShown: true,
            headerTitle: 'My RPG Maps',
            headerStyle: {
              backgroundColor: '#fff',
            },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
