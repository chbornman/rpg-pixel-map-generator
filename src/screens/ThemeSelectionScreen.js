import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getAllThemes } from '../constants/themes';
import { applyTheme } from '../utils/themeProcessor';
import { saveMap } from '../services/storage';

const ThemeSelectionScreen = ({ route, navigation }) => {
  const { imageUri, location, settings } = route.params;
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [previewImage, setPreviewImage] = useState(imageUri);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const themes = getAllThemes();

  const handleThemeSelect = async (theme) => {
    try {
      setSelectedTheme(theme);
      setIsProcessing(true);

      // Apply theme to image
      const themedUri = await applyTheme(
        imageUri,
        theme,
        settings.pixelationSize
      );

      setPreviewImage(themedUri);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error applying theme:', error);
      Alert.alert('Error', 'Failed to apply theme');
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedTheme) {
      Alert.alert('No Theme Selected', 'Please select a theme before saving');
      return;
    }

    try {
      setIsSaving(true);

      await saveMap({
        originalImage: imageUri,
        themedImage: previewImage,
        theme: selectedTheme.id,
        location,
        settings,
      });

      Alert.alert('Success', 'Map saved to gallery!', [
        {
          text: 'View Gallery',
          onPress: () => navigation.navigate('Gallery'),
        },
        {
          text: 'Capture Another',
          onPress: () => navigation.goBack(),
        },
      ]);

      setIsSaving(false);
    } catch (error) {
      console.error('Error saving map:', error);
      Alert.alert('Error', 'Failed to save map');
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Preview */}
      <View style={styles.previewContainer}>
        <Image source={{ uri: previewImage }} style={styles.preview} />
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.processingText}>Applying theme...</Text>
          </View>
        )}
      </View>

      {/* Theme Selection */}
      <View style={styles.themesContainer}>
        <Text style={styles.title}>Select a Theme</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              style={[
                styles.themeCard,
                selectedTheme?.id === theme.id && styles.themeCardSelected,
              ]}
              onPress={() => handleThemeSelect(theme)}
              disabled={isProcessing}
            >
              <View style={styles.themeColorPreview}>
                {theme.palette.slice(0, 4).map((color, index) => (
                  <View
                    key={index}
                    style={[styles.colorBlock, { backgroundColor: color }]}
                  />
                ))}
              </View>
              <Text style={styles.themeName}>{theme.name}</Text>
              <Text style={styles.themeDescription}>{theme.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, (!selectedTheme || isSaving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!selectedTheme || isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save to Gallery'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  preview: {
    width: 320,
    height: 320,
    resizeMode: 'contain',
    borderWidth: 2,
    borderColor: '#fff',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  processingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  themesContainer: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  themeCard: {
    width: 160,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginLeft: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderColor: '#007AFF',
  },
  themeColorPreview: {
    flexDirection: 'row',
    marginBottom: 10,
    height: 40,
  },
  colorBlock: {
    flex: 1,
    marginRight: 2,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#1a1a1a',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#555',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ThemeSelectionScreen;
