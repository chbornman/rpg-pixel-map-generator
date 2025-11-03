/**
 * MigrationScreen - Shows migration progress when upgrading from old storage format
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { needsMigration, migrateFromV0 } from '../services/migrationManager';

const MigrationScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('Checking for updates...');

  useEffect(() => {
    performMigration();
  }, []);

  const performMigration = async () => {
    try {
      const needsMig = await needsMigration();

      if (!needsMig) {
        setStatus('Up to date!');
        setTimeout(() => onComplete(), 500);
        return;
      }

      setStatus('Migrating data...');

      const result = await migrateFromV0((current, totalCount) => {
        setProgress(current);
        setTotal(totalCount);
        setStatus(`Migrating projects (${current}/${totalCount})...`);
      });

      setStatus('Migration complete!');
      console.log('Migration result:', result);

      setTimeout(() => onComplete(), 1000);
    } catch (error) {
      console.error('Migration failed:', error);
      setStatus('Migration failed. Starting fresh...');
      setTimeout(() => onComplete(), 2000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.title}>Upgrading App</Text>
        <Text style={styles.status}>{status}</Text>
        {total > 0 && (
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(progress / total) * 100}%` },
              ]}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
});

export default MigrationScreen;
