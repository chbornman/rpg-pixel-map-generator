import React, { useState, useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from '../screens/MapScreen';
import GalleryScreen from '../screens/GalleryScreen';
import ExportsLibraryScreen from '../screens/ExportsLibraryScreen';

// Lazy-loaded ExportScreen to avoid Skia initialization issues
// ExportScreen uses @shopify/react-native-skia which needs to be loaded after app initialization
const LazyExportScreen = (props) => {
  const [Screen, setScreen] = useState(null);

  useEffect(() => {
    import('../screens/ExportScreen').then((module) => {
      setScreen(() => module.default);
    });
  }, []);

  if (!Screen) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <Screen {...props} />;
};

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

// Bottom tab navigator
const TabNavigator = () => {
  return (
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
        component={MapScreen}
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
        }}
      />
    </Tab.Navigator>
  );
};

// Main root navigator with tabs + modal screens
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main tabs */}
        <RootStack.Screen name="Tabs" component={TabNavigator} />

        {/* Export flow screens */}
        <RootStack.Screen
          name="Export"
          component={LazyExportScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <RootStack.Screen
          name="ExportsLibrary"
          component={ExportsLibraryScreen}
          options={{
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
