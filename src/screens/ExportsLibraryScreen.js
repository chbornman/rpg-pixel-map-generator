/**
 * ExportsLibraryScreen - View and manage all generated exports
 */

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
  Share,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeftIcon, ShareIcon, TrashIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { getAllExports, deleteExport, getExportStats } from '../services/exportStorage';
import { getProject } from '../services/projectStorage';
import { getThemeById } from '../constants/themes';
import { formatBytes } from '../services/cacheManager';

const ExportsLibraryScreen = ({ navigation }) => {
  const [exports, setExports] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExport, setSelectedExport] = useState(null);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const loadExports = async () => {
    try {
      const allExports = await getAllExports();
      const exportStats = await getExportStats();

      setExports(allExports);
      setStats(exportStats);
    } catch (error) {
      console.error('Error loading exports:', error);
      Alert.alert('Error', 'Failed to load exports');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExports();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExports();
    setRefreshing(false);
  };

  const handleDelete = (exportItem) => {
    Alert.alert(
      'Delete Export',
      'Are you sure you want to delete this export?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExport(exportItem.id);
              await loadExports();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete export');
            }
          },
        },
      ]
    );
  };

  const handleShare = async (exportItem) => {
    try {
      await Share.share({
        url: exportItem.imagePath,
        message: `RPG Pixel Map Export - ${exportItem.theme}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewFullscreen = (exportItem) => {
    setSelectedExport(exportItem);
    setShowFullscreen(true);
  };

  const handleExportPress = (exportItem) => {
    Alert.alert(
      'Export Options',
      'Choose an action',
      [
        {
          text: 'View Fullscreen',
          onPress: () => handleViewFullscreen(exportItem),
        },
        {
          text: 'Share',
          onPress: () => handleShare(exportItem),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(exportItem),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderExportItem = ({ item }) => {
    const theme = getThemeById(item.theme);
    const date = new Date(item.timestamp);
    const resolution = `${item.resolution.width}x${item.resolution.height}`;

    return (
      <TouchableOpacity
        style={styles.exportItem}
        onPress={() => handleExportPress(item)}
        onLongPress={() => handleViewFullscreen(item)}
      >
        {/* Image */}
        <Image
          source={{ uri: item.imagePath }}
          style={styles.exportImage}
        />

        {/* Info */}
        <View style={styles.exportInfo}>
          <Text style={styles.themeName}>{theme.name}</Text>
          <Text style={styles.resolution}>{resolution}</Text>
          <Text style={styles.date}>
            {date.toLocaleDateString()}
          </Text>
          {item.fileSize > 0 && (
            <Text style={styles.fileSize}>{formatBytes(item.fileSize)}</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleShare(item)}
          >
            <ShareIcon size={16} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No Exports Yet</Text>
      <Text style={styles.emptySubtext}>
        Go to Gallery and export a project to see it here!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Gallery')}
      >
        <Text style={styles.emptyButtonText}>Go to Gallery</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeftIcon size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Exports Library</Text>
          <Text style={styles.headerSubtitle}>{exports.length} exports</Text>
        </View>
      </View>

      {/* Stats */}
      {stats && exports.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Exports</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatBytes(stats.totalSize)}</Text>
            <Text style={styles.statLabel}>Storage Used</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{(stats.avgDuration / 1000).toFixed(1)}s</Text>
            <Text style={styles.statLabel}>Avg Duration</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={exports}
        renderItem={renderExportItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Fullscreen Modal */}
      <Modal
        visible={showFullscreen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullscreen(false)}
      >
        <View style={styles.fullscreenModal}>
          <TouchableOpacity
            style={styles.fullscreenBackdrop}
            onPress={() => setShowFullscreen(false)}
            activeOpacity={1}
          />

          {selectedExport && (
            <>
              <Image
                source={{ uri: selectedExport.imagePath }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFullscreen(false)}
              >
                <XMarkIcon size={28} color="#fff" strokeWidth={2} />
              </TouchableOpacity>

              <View style={styles.fullscreenActions}>
                <TouchableOpacity
                  style={styles.fullscreenActionButton}
                  onPress={() => {
                    setShowFullscreen(false);
                    handleShare(selectedExport);
                  }}
                >
                  <ShareIcon size={24} color="#fff" strokeWidth={2} />
                  <Text style={styles.fullscreenActionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  grid: {
    padding: 12,
  },
  exportItem: {
    flex: 1,
    margin: 6,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exportImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#E5E7EB',
  },
  exportInfo: {
    padding: 12,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  resolution: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  quickActions: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullscreenImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenActions: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 16,
  },
  fullscreenActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  fullscreenActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExportsLibraryScreen;
