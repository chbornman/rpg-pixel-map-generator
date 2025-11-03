/**
 * Migration Manager
 * Handles migration from old storage format to new projects/exports architecture
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, SCHEMA_VERSION, DIRECTORIES, createProject, createExport } from '../constants/schemas';
import { ensureDirectories, copyToStorage } from './cacheManager';
import { generateThumbnail } from '../utils/thumbnailGenerator';

/**
 * Check if migration is needed
 */
export const needsMigration = async () => {
  try {
    // Check if we have the new schema version stored
    const version = await AsyncStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);

    if (!version) {
      // Check if old data exists
      const oldData = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_MAPS);
      return oldData !== null;
    }

    return parseInt(version) < SCHEMA_VERSION;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};

/**
 * Get current schema version
 */
export const getCurrentVersion = async () => {
  try {
    const version = await AsyncStorage.getItem(STORAGE_KEYS.SCHEMA_VERSION);
    return version ? parseInt(version) : 0;
  } catch (error) {
    console.error('Error getting current version:', error);
    return 0;
  }
};

/**
 * Migrate from V0 (old storage.js format) to V1 (projects/exports)
 */
export const migrateFromV0 = async (onProgress) => {
  try {
    // Ensure directories exist
    await ensureDirectories();

    // Get old maps
    const oldData = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_MAPS);
    if (!oldData) {
      console.log('No legacy data to migrate');
      await AsyncStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION.toString());
      return { migrated: 0, errors: 0 };
    }

    const oldMaps = JSON.parse(oldData);
    const projects = [];
    const exports = [];
    let migratedCount = 0;
    let errorCount = 0;

    console.log(`Starting migration of ${oldMaps.length} maps...`);

    for (let i = 0; i < oldMaps.length; i++) {
      const oldMap = oldMaps[i];

      try {
        if (onProgress) {
          onProgress(i + 1, oldMaps.length);
        }

        // Create thumbnail from themed image (if exists) or original
        const sourceImage = oldMap.themedImage || oldMap.originalImage;
        let thumbnailPath;

        try {
          const thumbnailUri = await generateThumbnail(sourceImage, 256);
          const thumbnailFilename = `${oldMap.id}_thumb_migrated.png`;
          thumbnailPath = await copyToStorage(
            thumbnailUri,
            DIRECTORIES.THUMBNAILS,
            thumbnailFilename
          );
        } catch (thumbError) {
          console.error(`Error generating thumbnail for map ${oldMap.id}:`, thumbError);
          // Skip this map if we can't create a thumbnail
          errorCount++;
          continue;
        }

        // Estimate region from location (we don't have latitudeDelta/longitudeDelta in old format)
        // Use a reasonable default zoom level
        const region = {
          latitude: oldMap.location.latitude,
          longitude: oldMap.location.longitude,
          latitudeDelta: 0.0922, // Default zoom
          longitudeDelta: 0.0421,
        };

        // Create project
        const project = createProject({
          region,
          location: {
            latitude: oldMap.location.latitude,
            longitude: oldMap.location.longitude,
            name: oldMap.location.name || 'Migrated Location',
            address: null,
          },
          settings: oldMap.settings || {
            aspectRatio: { label: '1:1', value: '1:1', ratio: 1 },
            pixelationSize: { label: '32px', value: 32 },
            outputResolution: { label: '1024px', value: 1024 },
            showGrid: false,
          },
          previewTheme: oldMap.theme || null,
          thumbnail: thumbnailPath,
          notes: 'Migrated from old format',
        });

        // Override the ID and timestamps to match old data
        project.id = oldMap.id;
        project.timestamp = oldMap.timestamp;
        project.lastModified = oldMap.timestamp;

        projects.push(project);

        // If themed image exists, create an export record
        if (oldMap.themedImage) {
          try {
            // Copy themed image to exports directory
            const exportFilename = `${oldMap.id}_migrated.png`;
            const exportPath = await copyToStorage(
              oldMap.themedImage,
              DIRECTORIES.EXPORTS,
              exportFilename
            );

            // Create export record
            const exportRecord = createExport({
              projectId: oldMap.id,
              theme: oldMap.theme,
              resolution: {
                width: oldMap.settings?.outputResolution?.value || 1024,
                height: oldMap.settings?.outputResolution?.value || 1024,
              },
              pixelationSize: oldMap.settings?.pixelationSize?.value || 32,
              imagePath: exportPath,
              fileSize: 0, // Will be calculated by storage service
              exportDuration: 0,
            });

            // Override timestamps
            exportRecord.timestamp = oldMap.timestamp;

            exports.push(exportRecord);
          } catch (exportError) {
            console.error(`Error migrating export for map ${oldMap.id}:`, exportError);
            // Continue without the export, but keep the project
          }
        }

        migratedCount++;
      } catch (mapError) {
        console.error(`Error migrating map ${oldMap.id}:`, mapError);
        errorCount++;
      }
    }

    // Save new data
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    await AsyncStorage.setItem(STORAGE_KEYS.EXPORTS, JSON.stringify(exports));

    // Mark migration as complete
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION.toString());

    // Optionally keep old data for backup (don't delete it)
    console.log(`Migration complete: ${migratedCount} migrated, ${errorCount} errors`);

    return {
      migrated: migratedCount,
      errors: errorCount,
      projects: projects.length,
      exports: exports.length,
    };
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

/**
 * Rollback migration (restore from legacy data)
 * Use with caution - this will delete new format data
 */
export const rollbackMigration = async () => {
  try {
    // Delete new format data
    await AsyncStorage.removeItem(STORAGE_KEYS.PROJECTS);
    await AsyncStorage.removeItem(STORAGE_KEYS.EXPORTS);
    await AsyncStorage.removeItem(STORAGE_KEYS.SCHEMA_VERSION);

    console.log('Migration rolled back');
    return true;
  } catch (error) {
    console.error('Error rolling back migration:', error);
    throw error;
  }
};

/**
 * Check migration status
 */
export const getMigrationStatus = async () => {
  try {
    const version = await getCurrentVersion();
    const needsMig = await needsMigration();
    const hasLegacyData = await AsyncStorage.getItem(STORAGE_KEYS.LEGACY_MAPS) !== null;
    const hasNewData = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS) !== null;

    return {
      currentVersion: version,
      targetVersion: SCHEMA_VERSION,
      needsMigration: needsMig,
      hasLegacyData,
      hasNewData,
    };
  } catch (error) {
    console.error('Error getting migration status:', error);
    return {
      currentVersion: 0,
      targetVersion: SCHEMA_VERSION,
      needsMigration: false,
      hasLegacyData: false,
      hasNewData: false,
    };
  }
};
