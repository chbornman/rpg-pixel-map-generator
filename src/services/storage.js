import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_KEY = '@rpg_maps';
const IMAGES_DIR = `${FileSystem.documentDirectory}rpg_maps/`;

// Ensure the images directory exists
const ensureDirectoryExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
};

// Save a captured map
export const saveMap = async (mapData) => {
  try {
    await ensureDirectoryExists();

    const id = Date.now().toString();
    const originalFileName = `${id}_original.png`;
    const themedFileName = `${id}_themed.png`;

    // Copy images to permanent storage
    const originalPath = IMAGES_DIR + originalFileName;
    const themedPath = IMAGES_DIR + themedFileName;

    await FileSystem.copyAsync({
      from: mapData.originalImage,
      to: originalPath,
    });

    if (mapData.themedImage) {
      await FileSystem.copyAsync({
        from: mapData.themedImage,
        to: themedPath,
      });
    }

    const savedMap = {
      id,
      originalImage: originalPath,
      themedImage: mapData.themedImage ? themedPath : null,
      theme: mapData.theme,
      location: mapData.location,
      settings: mapData.settings,
      timestamp: new Date().toISOString(),
    };

    // Get existing maps
    const maps = await getAllMaps();
    maps.unshift(savedMap); // Add to beginning

    // Save to AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(maps));

    return savedMap;
  } catch (error) {
    console.error('Error saving map:', error);
    throw error;
  }
};

// Get all saved maps
export const getAllMaps = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting maps:', error);
    return [];
  }
};

// Delete a map
export const deleteMap = async (id) => {
  try {
    const maps = await getAllMaps();
    const mapToDelete = maps.find((map) => map.id === id);

    if (mapToDelete) {
      // Delete image files
      if (mapToDelete.originalImage) {
        await FileSystem.deleteAsync(mapToDelete.originalImage, { idempotent: true });
      }
      if (mapToDelete.themedImage) {
        await FileSystem.deleteAsync(mapToDelete.themedImage, { idempotent: true });
      }
    }

    // Remove from array
    const updatedMaps = maps.filter((map) => map.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMaps));

    return true;
  } catch (error) {
    console.error('Error deleting map:', error);
    throw error;
  }
};

// Update theme for existing map
export const updateMapTheme = async (id, themedImage, themeName) => {
  try {
    await ensureDirectoryExists();

    const maps = await getAllMaps();
    const mapIndex = maps.findIndex((map) => map.id === id);

    if (mapIndex === -1) {
      throw new Error('Map not found');
    }

    const themedFileName = `${id}_themed.png`;
    const themedPath = IMAGES_DIR + themedFileName;

    // Delete old themed image if exists
    if (maps[mapIndex].themedImage) {
      await FileSystem.deleteAsync(maps[mapIndex].themedImage, { idempotent: true });
    }

    // Save new themed image
    await FileSystem.copyAsync({
      from: themedImage,
      to: themedPath,
    });

    maps[mapIndex].themedImage = themedPath;
    maps[mapIndex].theme = themeName;

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(maps));

    return maps[mapIndex];
  } catch (error) {
    console.error('Error updating map theme:', error);
    throw error;
  }
};
