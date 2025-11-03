import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Switch, Modal, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import MapView from 'react-native-maps';
import { captureRef } from 'react-native-view-shot';
import { PaintBrushIcon, CameraIcon, Cog6ToothIcon, MagnifyingGlassIcon, PhotoIcon } from 'react-native-heroicons/outline';
import { CheckCircleIcon } from 'react-native-heroicons/solid';
import ViewportOverlay from '../components/ViewportOverlay';
import SettingsSheet from '../components/SettingsSheet';
import SearchModal from '../components/SearchModal';
import { generateMapStyle } from '../constants/mapStyle';
import { DEFAULT_CAPTURE_SETTINGS, DEFAULT_EXPORT_SETTINGS } from '../constants/settings';
import { THEMES, getAllThemes } from '../constants/themes';
import { generateThumbnailWithAspect } from '../utils/thumbnailGenerator';
import { saveProject } from '../services/projectStorage';
import { pixelateImage, applyTheme } from '../utils/themeProcessor';

const MapScreen = ({ navigation }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  // Combine capture and export settings for UI state (only capture settings are saved)
  const [settings, setSettings] = useState({
    ...DEFAULT_CAPTURE_SETTINGS,
    ...DEFAULT_EXPORT_SETTINGS,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(THEMES.CLASSIC_JRPG);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Captured Location');
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const previewTimeoutRef = useRef(null);

  const handleUpdateSettings = (newSettings) => {
    setSettings({ ...settings, ...newSettings });
  };

  // Generate map style based on feature toggles
  const mapStyle = useMemo(() => {
    return generateMapStyle(settings.mapFeatures);
  }, [settings.mapFeatures]);

  // Calculate viewport dimensions (same logic as ViewportOverlay)
  const calculateViewportDimensions = useCallback(() => {
    const maxWidth = SCREEN_WIDTH * 0.8;
    const maxHeight = SCREEN_HEIGHT * 0.6;

    let viewportWidth, viewportHeight;

    if (settings.aspectRatio.ratio >= 1) {
      // Landscape or square
      viewportWidth = Math.min(maxWidth, maxHeight * settings.aspectRatio.ratio);
      viewportHeight = viewportWidth / settings.aspectRatio.ratio;
    } else {
      // Portrait
      viewportHeight = Math.min(maxHeight, maxWidth / settings.aspectRatio.ratio);
      viewportWidth = viewportHeight * settings.aspectRatio.ratio;
    }

    return { width: viewportWidth, height: viewportHeight };
  }, [settings.aspectRatio.ratio]);

  const handleSelectLocation = (location) => {
    const newRegion = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };

    // Animate map to new location
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }

    // Update region and location name
    setRegion(newRegion);
    setCurrentLocation(location.name || location.address || 'Captured Location');
  };

  const generateThemePreview = useCallback(async (theme) => {
    try {
      setIsGeneratingPreview(true);
      const startTime = Date.now();

      // Capture the current map view
      const uri = await captureRef(mapContainerRef, {
        format: 'png',
        quality: 0.8,
      });

      // Pixelate the image (small size for preview)
      const pixelated = await pixelateImage(
        uri,
        settings.pixelationSize.value,
        512, // Preview at 512px for speed
        settings.aspectRatio.ratio
      );

      // Apply the theme with all effects
      const themed = await applyTheme(pixelated, theme, settings.pixelationSize.value, {
        ditherIntensity: settings.ditherIntensity.value,
        edgeDetection: settings.edgeDetection.value,
        contrast: settings.contrast.value,
        saturation: settings.saturation.value,
      });

      const duration = Date.now() - startTime;
      console.log(`Theme preview generated in ${duration}ms`);

      setPreviewImage(themed);
      hasGeneratedPreview.current = true;
      setIsGeneratingPreview(false);
    } catch (error) {
      console.error('Error generating theme preview:', error);
      setIsGeneratingPreview(false);
      // Don't show alert on auto-refresh errors
    }
  }, [settings.aspectRatio.ratio, settings.pixelationSize.value]);

  // Preview refresh on map movement (no debounce for testing)
  const handleRegionChange = useCallback((newRegion) => {
    setRegion(newRegion);

    // Only regenerate preview if enabled
    if (previewEnabled && selectedTheme) {
      // Generate immediately without debounce
      generateThemePreview(selectedTheme);
    }
  }, [previewEnabled, selectedTheme, generateThemePreview]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  // Regenerate preview when settings change (if preview is enabled)
  // Use a ref to track if we've generated at least one preview
  const hasGeneratedPreview = useRef(false);

  useEffect(() => {
    // Only regenerate if preview is enabled and we've already generated once
    if (previewEnabled && selectedTheme && hasGeneratedPreview.current) {
      // Debounce settings changes
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }

      previewTimeoutRef.current = setTimeout(() => {
        console.log('Settings changed, regenerating preview...');
        generateThemePreview(selectedTheme);
      }, 500);
    }
  }, [
    settings.aspectRatio.ratio,
    settings.pixelationSize.value,
    settings.ditherIntensity.value,
    settings.edgeDetection.value,
    settings.contrast.value,
    settings.saturation.value,
    previewEnabled,
    selectedTheme,
    generateThemePreview,
  ]);

  const handleCapture = async () => {
    try {
      setIsProcessing(true);

      // Capture the map view
      const uri = await captureRef(mapContainerRef, {
        format: 'png',
        quality: 1,
      });

      // Generate thumbnail (lightweight preview)
      const thumbnailUri = await generateThumbnailWithAspect(
        uri,
        256,
        settings.aspectRatio.ratio
      );

      // Save as project (metadata + thumbnail only)
      const project = await saveProject({
        region: {
          latitude: region.latitude,
          longitude: region.longitude,
          latitudeDelta: region.latitudeDelta,
          longitudeDelta: region.longitudeDelta,
        },
        location: {
          latitude: region.latitude,
          longitude: region.longitude,
          name: currentLocation,
          address: null,
        },
        settings: {
          aspectRatio: settings.aspectRatio,
          showGrid: settings.showGrid,
          mapFeatures: settings.mapFeatures,
        },
        previewTheme: previewEnabled ? selectedTheme.id : null,
        thumbnail: thumbnailUri,
        notes: null,
      });

      setIsProcessing(false);

      // Show success message
      Alert.alert(
        'Project Saved!',
        'Your map has been captured. Go to Gallery to export it with different themes and resolutions.',
        [
          {
            text: 'View in Gallery',
            onPress: () => navigation.navigate('Gallery'),
          },
          { text: 'Capture Another', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Error capturing map:', error);
      Alert.alert('Error', 'Failed to save project');
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <View style={styles.mapContainer} ref={mapContainerRef} collapsable={false}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChange}
          customMapStyle={mapStyle}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          toolbarEnabled={false}
        />
      </View>

      {/* Viewport Overlay */}
      <ViewportOverlay
        aspectRatio={settings.aspectRatio.ratio}
        showGrid={settings.showGrid}
      />

      {/* Theme Preview - positioned to match viewport */}
      {previewEnabled && previewImage && (() => {
        const { width, height } = calculateViewportDimensions();
        return (
          <View style={[
            styles.previewOverlay,
            { width, height }
          ]} pointerEvents="none">
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: previewImage }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.previewLabel}>
                <PaintBrushIcon size={12} color="#fff" strokeWidth={2} />
                <Text style={styles.previewLabelText}>{selectedTheme.name}</Text>
              </View>
            </View>
          </View>
        );
      })()}

      {/* Bottom Floating Bar */}
      <View style={styles.bottomBar}>
        {/* Left Side - Theme Button */}
        <View style={styles.leftControls}>
          <TouchableOpacity
            style={[styles.iconButton, previewEnabled && styles.iconButtonActive]}
            onPress={() => setShowThemePicker(true)}
          >
            <PaintBrushIcon
              size={22}
              color={previewEnabled ? '#fff' : '#9CA3AF'}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* Center - Gallery & Capture Buttons */}
        <View style={styles.centerControls}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Gallery')}
          >
            <PhotoIcon size={22} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <CameraIcon size={28} color="#fff" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        {/* Right Side - Settings & Search Icons */}
        <View style={styles.rightControls}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSettings(true)}
          >
            <Cog6ToothIcon size={22} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setShowSearch(true)}
          >
            <MagnifyingGlassIcon size={22} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>


      {/* Theme Picker Modal */}
      <Modal
        visible={showThemePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowThemePicker(false)}
      >
        <View style={styles.themeModalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setShowThemePicker(false)}
            activeOpacity={1}
          />
          <View style={styles.themeSheet}>
            <View style={styles.handle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Theme</Text>
              <TouchableOpacity onPress={() => setShowThemePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.themeList}>
              {/* None Option */}
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  !previewEnabled && styles.themeOptionSelected,
                ]}
                onPress={() => {
                  setPreviewEnabled(false);
                  setPreviewImage(null);
                  hasGeneratedPreview.current = false;
                  setShowThemePicker(false);
                }}
              >
                <View style={styles.themeInfo}>
                  <Text style={styles.themeName}>No Theme</Text>
                  <Text style={styles.themeDescription}>Disable theme preview</Text>
                </View>
                {!previewEnabled && (
                  <CheckCircleIcon size={28} color="#3B82F6" />
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.themeDivider} />

              {/* Theme Options */}
              {getAllThemes().map((theme) => (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeOption,
                    previewEnabled && selectedTheme.id === theme.id && styles.themeOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedTheme(theme);
                    setPreviewEnabled(true);
                    setShowThemePicker(false);
                    generateThemePreview(theme);
                  }}
                >
                  <View style={styles.themeInfo}>
                    <Text style={styles.themeName}>{theme.name}</Text>
                    <Text style={styles.themeDescription}>{theme.description}</Text>
                    <View style={styles.palettePreview}>
                      {theme.palette.slice(0, 8).map((color, idx) => (
                        <View
                          key={idx}
                          style={[styles.colorSwatch, { backgroundColor: color }]}
                        />
                      ))}
                    </View>
                  </View>
                  {previewEnabled && selectedTheme.id === theme.id && (
                    <CheckCircleIcon size={28} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Sheet */}
      <SettingsSheet
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Search Modal */}
      <SearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectLocation={handleSelectLocation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#3B82F6',
  },
  captureButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  captureButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  themeModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  themeSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  modalClose: {
    fontSize: 28,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  themeList: {
    padding: 20,
  },
  themeDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  themeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  themeOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  themeDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
    letterSpacing: 0.1,
  },
  palettePreview: {
    flexDirection: 'row',
    gap: 6,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  previewOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 0.8)',
    zIndex: 1000,
    elevation: 10,
  },
  previewLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  previewLoadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  previewLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});

export default MapScreen;
