import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Switch, Modal, ScrollView, ActivityIndicator } from 'react-native';
import MapView from 'react-native-maps';
import { captureRef } from 'react-native-view-shot';
import { PaintBrushIcon, CameraIcon, Cog6ToothIcon, MagnifyingGlassIcon, PhotoIcon } from 'react-native-heroicons/outline';
import { CheckCircleIcon } from 'react-native-heroicons/solid';
import ViewportOverlay from '../components/ViewportOverlay';
import SettingsSheet from '../components/SettingsSheet';
import SearchModal from '../components/SearchModal';
import { MAP_STYLE_NO_LABELS } from '../constants/mapStyle';
import { DEFAULT_SETTINGS } from '../constants/settings';
import { THEMES, getAllThemes } from '../constants/themes';
import { pixelateImage, applyTheme } from '../utils/themeProcessor';

const MapScreen = ({ navigation }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
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

  const handleUpdateSettings = (newSettings) => {
    setSettings({ ...settings, ...newSettings });
  };

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

  const handleCapture = async () => {
    try {
      setIsProcessing(true);

      // Capture the map view
      const uri = await captureRef(mapContainerRef, {
        format: 'png',
        quality: 1,
      });

      // Apply pixelation with aspect ratio cropping
      const pixelatedUri = await pixelateImage(
        uri,
        settings.pixelationSize.value,
        settings.outputResolution.value,
        settings.aspectRatio.ratio
      );

      // If preview mode is enabled, apply theme directly and go to gallery
      if (previewEnabled) {
        const themedUri = await applyTheme(
          pixelatedUri,
          selectedTheme,
          settings.pixelationSize.value
        );

        Alert.alert(
          'Success!',
          `Captured with ${selectedTheme.name} theme`,
          [
            {
              text: 'View in Gallery',
              onPress: () => navigation.navigate('Gallery'),
            },
            { text: 'OK' },
          ]
        );

        setIsProcessing(false);
      } else {
        // Navigate to theme selection screen
        navigation.navigate('ThemeSelection', {
          imageUri: pixelatedUri,
          location: {
            latitude: region.latitude,
            longitude: region.longitude,
            name: currentLocation,
          },
          settings: {
            aspectRatio: settings.aspectRatio.value,
            pixelationSize: settings.pixelationSize.value,
            outputResolution: settings.outputResolution.value,
          },
        });

        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error capturing map:', error);
      Alert.alert('Error', 'Failed to capture map');
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
          onRegionChangeComplete={setRegion}
          customMapStyle={MAP_STYLE_NO_LABELS}
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
});

export default MapScreen;
