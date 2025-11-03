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
import { ArrowUpTrayIcon, DocumentDuplicateIcon, TrashIcon, CogIcon } from 'react-native-heroicons/outline';
import { getAllProjects, deleteProject, duplicateProject } from '../services/projectStorage';
import { deleteExportsForProject, projectHasExports } from '../services/exportStorage';
import { getThemeById } from '../constants/themes';

const GalleryScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = async () => {
    try {
      const savedProjects = await getAllProjects();
      setProjects(savedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'Failed to load gallery');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleDelete = (project) => {
    Alert.alert(
      'Delete Project',
      'This will delete the project and all its exports. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all exports first
              await deleteExportsForProject(project.id);
              // Delete project
              await deleteProject(project.id);
              await loadProjects();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const handleDuplicate = async (project) => {
    try {
      await duplicateProject(project.id);
      await loadProjects();
      Alert.alert('Success', 'Project duplicated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to duplicate project');
    }
  };

  const handleProjectPress = (project) => {
    // Navigate to Export screen
    navigation.navigate('Export', { projectId: project.id });
  };

  const handleProjectOptions = (project) => {
    Alert.alert(
      project.location.name,
      'Choose an action',
      [
        {
          text: 'Export',
          onPress: () => navigation.navigate('Export', { projectId: project.id }),
        },
        {
          text: 'Duplicate',
          onPress: () => handleDuplicate(project),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(project),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderProjectItem = ({ item }) => {
    const theme = item.previewTheme ? getThemeById(item.previewTheme) : null;
    const date = new Date(item.timestamp);

    return (
      <TouchableOpacity
        style={styles.projectItem}
        onPress={() => handleProjectPress(item)}
        onLongPress={() => handleProjectOptions(item)}
      >
        {/* Thumbnail */}
        <Image
          source={{ uri: item.thumbnail }}
          style={[
            styles.thumbnail,
            { aspectRatio: item.settings.aspectRatio.ratio }
          ]}
          resizeMode="cover"
        />

        {/* Info Overlay */}
        <View style={styles.projectInfo}>
          <Text style={styles.locationName} numberOfLines={1}>
            {item.location.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.date}>
              {date.toLocaleDateString()}
            </Text>
            {theme && (
              <View style={styles.themeBadge}>
                <Text style={styles.themeBadgeText}>{theme.name}</Text>
              </View>
            )}
          </View>
          <Text style={styles.settings}>
            {item.settings.aspectRatio.value} • {item.settings.pixelationSize.value}px
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Export', { projectId: item.id })}
          >
            <ArrowUpTrayIcon size={18} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No Projects Yet</Text>
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

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Gallery</Text>
        <Text style={styles.headerSubtitle}>{projects.length} projects</Text>
      </View>
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={[styles.headerButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('MapTab')}
        >
          <Text style={styles.secondaryButtonText}>Capture</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('ExportsLibrary')}
        >
          <Text style={styles.headerButtonText}>Exports</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={renderProjectItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={renderHeader}
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
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 14,
  },
  grid: {
    padding: 12,
  },
  projectItem: {
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
    minHeight: 220,
  },
  thumbnail: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  projectInfo: {
    padding: 12,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  themeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  themeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3B82F6',
  },
  settings: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  quickActions: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
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
});

export default GalleryScreen;
