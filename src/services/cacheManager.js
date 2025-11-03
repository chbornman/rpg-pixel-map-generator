/**
 * Cache management service
 * Handles temporary files, orphaned files, and disk space optimization
 */

import * as FileSystem from 'expo-file-system/legacy';
import { DIRECTORIES } from '../constants/schemas';

// Get base directory dynamically to avoid initialization issues
const getBaseDir = () => FileSystem.documentDirectory;

/**
 * Ensure all required directories exist
 */
export const ensureDirectories = async () => {
  try {
    const baseDir = getBaseDir();
    for (const dir of Object.values(DIRECTORIES)) {
      const fullPath = baseDir + dir;
      const dirInfo = await FileSystem.getInfoAsync(fullPath);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(fullPath, { intermediates: true });
      }
    }
  } catch (error) {
    console.error('Error ensuring directories:', error);
    throw error;
  }
};

/**
 * Get file size in bytes
 */
const getFileSize = async (uri) => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? info.size : 0;
  } catch {
    return 0;
  }
};

/**
 * Get total size of files in a directory
 */
const getDirectorySize = async (dirPath) => {
  try {
    const files = await FileSystem.readDirectoryAsync(dirPath);
    let totalSize = 0;

    for (const file of files) {
      const filePath = `${dirPath}${file}`;
      const size = await getFileSize(filePath);
      totalSize += size;
    }

    return totalSize;
  } catch (error) {
    console.error(`Error getting directory size for ${dirPath}:`, error);
    return 0;
  }
};

/**
 * Get storage report with disk usage statistics
 */
export const getStorageReport = async () => {
  try {
    await ensureDirectories();

    const baseDir = getBaseDir();
    const thumbnailsPath = baseDir + DIRECTORIES.THUMBNAILS;
    const exportsPath = baseDir + DIRECTORIES.EXPORTS;
    const cachePath = baseDir + DIRECTORIES.CACHE;

    const [thumbnailsSize, exportsSize, cacheSize] = await Promise.all([
      getDirectorySize(thumbnailsPath),
      getDirectorySize(exportsPath),
      getDirectorySize(cachePath),
    ]);

    const thumbnailFiles = await FileSystem.readDirectoryAsync(thumbnailsPath);
    const exportFiles = await FileSystem.readDirectoryAsync(exportsPath);
    const cacheFiles = await FileSystem.readDirectoryAsync(cachePath);

    return {
      thumbnails: {
        count: thumbnailFiles.length,
        size: thumbnailsSize,
        sizeFormatted: formatBytes(thumbnailsSize),
      },
      exports: {
        count: exportFiles.length,
        size: exportsSize,
        sizeFormatted: formatBytes(exportsSize),
      },
      cache: {
        count: cacheFiles.length,
        size: cacheSize,
        sizeFormatted: formatBytes(cacheSize),
      },
      total: {
        size: thumbnailsSize + exportsSize + cacheSize,
        sizeFormatted: formatBytes(thumbnailsSize + exportsSize + cacheSize),
      },
    };
  } catch (error) {
    console.error('Error getting storage report:', error);
    throw error;
  }
};

/**
 * Clear all temporary/cache files
 */
export const clearTempFiles = async () => {
  try {
    const baseDir = getBaseDir();
    const cachePath = baseDir + DIRECTORIES.CACHE;
    const files = await FileSystem.readDirectoryAsync(cachePath);

    for (const file of files) {
      await FileSystem.deleteAsync(`${cachePath}${file}`, { idempotent: true });
    }

    return files.length;
  } catch (error) {
    console.error('Error clearing temp files:', error);
    throw error;
  }
};

/**
 * Find and remove orphaned files (files not referenced in metadata)
 */
export const cleanOrphanedFiles = async (validThumbnails = [], validExports = []) => {
  try {
    let removedCount = 0;

    const baseDir = getBaseDir();

    // Clean thumbnails
    const thumbnailsPath = baseDir + DIRECTORIES.THUMBNAILS;
    const thumbnailFiles = await FileSystem.readDirectoryAsync(thumbnailsPath);

    for (const file of thumbnailFiles) {
      const fullPath = `${thumbnailsPath}${file}`;
      if (!validThumbnails.includes(fullPath)) {
        await FileSystem.deleteAsync(fullPath, { idempotent: true });
        removedCount++;
      }
    }

    // Clean exports
    const exportsPath = baseDir + DIRECTORIES.EXPORTS;
    const exportFiles = await FileSystem.readDirectoryAsync(exportsPath);

    for (const file of exportFiles) {
      const fullPath = `${exportsPath}${file}`;
      if (!validExports.includes(fullPath)) {
        await FileSystem.deleteAsync(fullPath, { idempotent: true });
        removedCount++;
      }
    }

    return removedCount;
  } catch (error) {
    console.error('Error cleaning orphaned files:', error);
    throw error;
  }
};

/**
 * Copy file to permanent storage
 */
export const copyToStorage = async (sourceUri, destDirectory, filename) => {
  try {
    await ensureDirectories();

    const baseDir = getBaseDir();
    const destPath = baseDir + destDirectory + filename;

    await FileSystem.copyAsync({
      from: sourceUri,
      to: destPath,
    });

    return destPath;
  } catch (error) {
    console.error('Error copying file to storage:', error);
    throw error;
  }
};

/**
 * Delete a file safely
 */
export const deleteFile = async (filePath) => {
  try {
    await FileSystem.deleteAsync(filePath, { idempotent: true });
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Check if file exists
 */
export const fileExists = async (filePath) => {
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    return info.exists;
  } catch {
    return false;
  }
};

/**
 * Get file info
 */
export const getFileInfo = async (filePath) => {
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    return info.exists ? info : null;
  } catch {
    return null;
  }
};
