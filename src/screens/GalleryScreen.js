import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAllMaps, deleteMap } from '../services/storage';
import { getThemeById } from '../constants/themes';

const GalleryScreen = ({ navigation }) => {
  const [maps, setMaps] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMaps = async () => {
    try {
      const savedMaps = await getAllMaps();
      setMaps(savedMaps);
    } catch (error) {
      console.error('Error loading maps:', error);
      Alert.alert('Error', 'Failed to load gallery');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMaps();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMaps();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Map',
      'Are you sure you want to delete this map?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMap(id);
              await loadMaps();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete map');
            }
          },
        },
      ]
    );
  };

  const handleMapPress = (map) => {
    Alert.alert(
      'Map Options',
      'What would you like to do?',
      [
        {
          text: 'Re-theme',
          onPress: () => {
            navigation.navigate('ThemeSelection', {
              imageUri: map.originalImage,
              location: map.location,
              settings: map.settings,
              isRetheme: true,
              mapId: map.id,
            });
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(map.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderMapItem = ({ item }) => {
    const theme = getThemeById(item.theme);
    const date = new Date(item.timestamp);

    return (
      <TouchableOpacity
        style={styles.mapItem}
        onPress={() => handleMapPress(item)}
      >
        <Image
          source={{ uri: item.themedImage || item.originalImage }}
          style={styles.thumbnail}
        />
        <View style={styles.mapInfo}>
          <Text style={styles.themeName}>{theme.name}</Text>
          <Text style={styles.date}>
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </Text>
          <Text style={styles.settings}>
            {item.settings.aspectRatio} • {item.settings.pixelationSize}px
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No maps captured yet</Text>
      <Text style={styles.emptySubtext}>
        Go to the Map tab and capture your first RPG map!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('MapTab')}
      >
        <Text style={styles.emptyButtonText}>Start Capturing</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={maps}
        renderItem={renderMapItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  grid: {
    padding: 10,
  },
  mapItem: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e0e0e0',
  },
  mapInfo: {
    padding: 10,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  settings: {
    fontSize: 10,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GalleryScreen;
