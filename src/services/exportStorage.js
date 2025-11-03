/**
 * Export Storage Service
 * Manages rendered high-resolution exports
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, DIRECTORIES, createExport, isValidExport } from '../constants/schemas';
import { copyToStorage, deleteFile, getFileInfo } from './cacheManager';

/**
 * Save a new export
 */
export const saveExport = async (exportData) => {
  try {
    // Copy image to permanent storage
    const filename = `${exportData.projectId}_${Date.now()}.png`;
    const imagePath = await copyToStorage(
      exportData.imagePath,
      DIRECTORIES.EXPORTS,
      filename
    );

    // Get file size
    const fileInfo = await getFileInfo(imagePath);
    const fileSize = fileInfo?.size || 0;

    // Create export record
    const exportRecord = createExport({
      ...exportData,
      imagePath,
      fileSize,
    });

    // Get existing exports
    const exports = await getAllExports();
    exports.unshift(exportRecord); // Add to beginning (newest first)

    // Save to AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.EXPORTS, JSON.stringify(exports));

    return exportRecord;
  } catch (error) {
    console.error('Error saving export:', error);
    throw error;
  }
};

/**
 * Get all exports
 */
export const getAllExports = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EXPORTS);
    const exports = data ? JSON.parse(data) : [];

    // Filter out invalid exports
    return exports.filter(isValidExport);
  } catch (error) {
    console.error('Error getting exports:', error);
    return [];
  }
};

/**
 * Get exports for a specific project
 */
export const getExportsForProject = async (projectId) => {
  try {
    const exports = await getAllExports();
    return exports.filter((e) => e.projectId === projectId);
  } catch (error) {
    console.error('Error getting exports for project:', error);
    return [];
  }
};

/**
 * Get a single export by ID
 */
export const getExport = async (id) => {
  try {
    const exports = await getAllExports();
    return exports.find((e) => e.id === id) || null;
  } catch (error) {
    console.error('Error getting export:', error);
    return null;
  }
};

/**
 * Delete an export
 */
export const deleteExport = async (id) => {
  try {
    const exports = await getAllExports();
    const exportToDelete = exports.find((e) => e.id === id);

    if (!exportToDelete) {
      throw new Error('Export not found');
    }

    // Delete image file
    await deleteFile(exportToDelete.imagePath);

    // Remove from array
    const updatedExports = exports.filter((e) => e.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.EXPORTS, JSON.stringify(updatedExports));

    return true;
  } catch (error) {
    console.error('Error deleting export:', error);
    throw error;
  }
};

/**
 * Delete all exports for a specific project
 */
export const deleteExportsForProject = async (projectId) => {
  try {
    const exports = await getExportsForProject(projectId);

    // Delete all export files
    await Promise.all(exports.map((e) => deleteFile(e.imagePath)));

    // Remove from storage
    const allExports = await getAllExports();
    const updatedExports = allExports.filter((e) => e.projectId !== projectId);
    await AsyncStorage.setItem(STORAGE_KEYS.EXPORTS, JSON.stringify(updatedExports));

    return exports.length;
  } catch (error) {
    console.error('Error deleting exports for project:', error);
    throw error;
  }
};

/**
 * Get export statistics
 */
export const getExportStats = async () => {
  try {
    const exports = await getAllExports();

    // Total file size
    const totalSize = exports.reduce((sum, e) => sum + (e.fileSize || 0), 0);

    // Count by theme
    const themeCount = {};
    exports.forEach((e) => {
      themeCount[e.theme] = (themeCount[e.theme] || 0) + 1;
    });

    // Count by resolution
    const resolutionCount = {};
    exports.forEach((e) => {
      const res = `${e.resolution.width}x${e.resolution.height}`;
      resolutionCount[res] = (resolutionCount[res] || 0) + 1;
    });

    // Average export duration
    const avgDuration = exports.length > 0
      ? exports.reduce((sum, e) => sum + (e.exportDuration || 0), 0) / exports.length
      : 0;

    return {
      total: exports.length,
      totalSize,
      byTheme: themeCount,
      byResolution: resolutionCount,
      avgDuration: Math.round(avgDuration),
      oldest: exports[exports.length - 1]?.timestamp || null,
      newest: exports[0]?.timestamp || null,
    };
  } catch (error) {
    console.error('Error getting export stats:', error);
    return { total: 0, totalSize: 0, byTheme: {}, byResolution: {}, avgDuration: 0 };
  }
};

/**
 * Get exports filtered by criteria
 */
export const getFilteredExports = async (filter) => {
  try {
    const exports = await getAllExports();

    switch (filter) {
      case 'recent':
        // Last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return exports.filter((e) => new Date(e.timestamp) > weekAgo);

      case 'large':
        // Files larger than 1MB
        return exports.filter((e) => e.fileSize > 1024 * 1024);

      case 'theme':
        // Would need theme parameter, return all for now
        return exports;

      default:
        return exports;
    }
  } catch (error) {
    console.error('Error filtering exports:', error);
    return [];
  }
};

/**
 * Check if a project has any exports
 */
export const projectHasExports = async (projectId) => {
  try {
    const exports = await getExportsForProject(projectId);
    return exports.length > 0;
  } catch (error) {
    console.error('Error checking project exports:', error);
    return false;
  }
};
