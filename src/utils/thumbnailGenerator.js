/**
 * Thumbnail generation utility
 * Creates preview thumbnails for projects
 */

import * as ImageManipulator from 'expo-image-manipulator';

const THUMBNAIL_SIZE = 256; // Square thumbnails

/**
 * Generate a thumbnail from an image URI
 * @param {string} imageUri - Source image URI
 * @param {number} size - Thumbnail size (default: 256)
 * @returns {Promise<string>} - Thumbnail URI
 */
export const generateThumbnail = async (imageUri, size = THUMBNAIL_SIZE) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: size,
            height: size,
          },
        },
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.PNG,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
};

/**
 * Generate a thumbnail with aspect ratio preserved
 * @param {string} imageUri - Source image URI
 * @param {number} maxSize - Maximum dimension
 * @param {number} aspectRatio - Aspect ratio (width/height)
 * @returns {Promise<string>} - Thumbnail URI
 */
export const generateThumbnailWithAspect = async (
  imageUri,
  maxSize = THUMBNAIL_SIZE,
  aspectRatio = 1
) => {
  try {
    let width, height;

    if (aspectRatio >= 1) {
      // Landscape or square
      width = maxSize;
      height = maxSize / aspectRatio;
    } else {
      // Portrait
      height = maxSize;
      width = maxSize * aspectRatio;
    }

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: Math.round(width),
            height: Math.round(height),
          },
        },
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.PNG,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('Error generating thumbnail with aspect:', error);
    throw error;
  }
};

/**
 * Generate a quick preview thumbnail with theme applied
 * @param {string} imageUri - Pixelated image URI
 * @param {Object} theme - Theme object
 * @param {number} size - Thumbnail size
 * @returns {Promise<string>} - Themed thumbnail URI
 */
export const generateThemedThumbnail = async (
  imageUri,
  theme,
  size = THUMBNAIL_SIZE
) => {
  try {
    // First resize to thumbnail size
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: size,
            height: size,
          },
        },
      ],
      {
        compress: 1,
        format: ImageManipulator.SaveFormat.PNG,
      }
    );

    // Note: For themed thumbnails, we'll need to apply the theme
    // using the Skia shader (similar to themeProcessor.js)
    // For now, just return the resized image
    // TODO: Integrate with applyTheme for actual themed previews

    return resized.uri;
  } catch (error) {
    console.error('Error generating themed thumbnail:', error);
    throw error;
  }
};
