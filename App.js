import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import MigrationScreen from './src/components/MigrationScreen';
import { needsMigration } from './src/services/migrationManager';
import { ensureDirectories } from './src/services/cacheManager';

export default function App() {
  const [showMigration, setShowMigration] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      // Ensure storage directories exist
      await ensureDirectories();

      // Check if migration is needed
      const needsMig = await needsMigration();

      if (!needsMig) {
        setShowMigration(false);
      }

      setIsReady(true);
    } catch (error) {
      console.error('Error initializing app:', error);
      // Continue anyway
      setShowMigration(false);
      setIsReady(true);
    }
  };

  const handleMigrationComplete = () => {
    setShowMigration(false);
  };

  if (!isReady) {
    return null; // Or a splash screen
  }

  if (showMigration) {
    return <MigrationScreen onComplete={handleMigrationComplete} />;
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}
