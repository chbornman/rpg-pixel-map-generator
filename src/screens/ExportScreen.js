/**
 * ExportScreen - On-demand high-resolution rendering
 * Allows users to export projects with custom themes and settings
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import MapView from 'react-native-maps';
import { captureRef } from 'react-native-view-shot';
import { ArrowLeftIcon, CheckCircleIcon, ShareIcon, Cog6ToothIcon } from 'react-native-heroicons/outline';
import { getProject } from '../services/projectStorage';
import { saveExport } from '../services/exportStorage';
import { getAllThemes, getThemeById } from '../constants/themes';
import { MAP_STYLE_NO_LABELS } from '../constants/mapStyle';
import { pixelateImage, applyTheme } from '../utils/themeProcessor';
import { DEFAULT_EXPORT_SETTINGS } from '../constants/settings';
import ExportSettingsSheet from '../components/ExportSettingsSheet';

const ExportScreen = ({ route, navigation }) => {
  const { projectId } = route.params;
  const mapContainerRef = useRef(null);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  // Export settings
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [exportSettings, setExportSettings] = useState(DEFAULT_EXPORT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const proj = await getProject(projectId);
      if (!proj) {
        Alert.alert('Error', 'Project not found');
        navigation.goBack();
        return;
      }

      setProject(proj);

      // Set theme from project preview (if any)
      setSelectedTheme(
        proj.previewTheme ? getThemeById(proj.previewTheme) : getAllThemes()[0]
      );

      setLoading(false);
    } catch (error) {
      console.error('Error loading project:', error);
      Alert.alert('Error', 'Failed to load project');
      navigation.goBack();
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const startTime = Date.now();

      // Step 1: Capture map view at current region/zoom
      setExportProgress('Capturing map...');
      const mapUri = await captureRef(mapContainerRef, {
        format: 'png',
        quality: 1,
      });

      // Step 2: Apply pixelation
      setExportProgress('Applying pixelation...');
      const pixelatedUri = await pixelateImage(
        mapUri,
        exportSettings.pixelationSize.value,
        exportSettings.outputResolution.value,
        project.settings.aspectRatio.ratio
      );

      // Step 3: Apply theme with effects
      setExportProgress('Applying theme with effects...');
      const themedUri = await applyTheme(
        pixelatedUri,
        selectedTheme,
        exportSettings.pixelationSize.value,
        {
          ditherIntensity: exportSettings.ditherIntensity.value,
          edgeDetection: exportSettings.edgeDetection.value,
          contrast: exportSettings.contrast.value,
          saturation: exportSettings.saturation.value,
        }
      );

      // Step 4: Save export
      setExportProgress('Saving export...');
      const exportDuration = Date.now() - startTime;

      const exportRecord = await saveExport({
        projectId: project.id,
        theme: selectedTheme.id,
        resolution: {
          width: exportSettings.outputResolution.value,
          height: Math.round(exportSettings.outputResolution.value / project.settings.aspectRatio.ratio),
        },
        pixelationSize: exportSettings.pixelationSize.value,
        ditherIntensity: exportSettings.ditherIntensity.value,
        edgeDetection: exportSettings.edgeDetection.value,
        contrast: exportSettings.contrast.value,
        saturation: exportSettings.saturation.value,
        imagePath: themedUri,
        exportDuration,
      });

      setExporting(false);
      setExportProgress('');

      // Show success with options
      Alert.alert(
        'Export Complete!',
        `Exported with ${selectedTheme.name} theme in ${(exportDuration / 1000).toFixed(1)}s`,
        [
          {
            text: 'Share',
            onPress: () => handleShare(exportRecord.imagePath),
          },
          {
            text: 'View Exports',
            onPress: () => navigation.navigate('ExportsLibrary'),
          },
          { text: 'Export Another' },
        ]
      );
    } catch (error) {
      console.error('Error exporting:', error);
      Alert.alert('Export Failed', error.message || 'Failed to create export');
      setExporting(false);
      setExportProgress('');
    }
  };

  const handleShare = async (imagePath) => {
    try {
      await Share.share({
        url: imagePath,
        message: `RPG Pixel Map - ${project.location.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeftIcon size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{project.location.name}</Text>
          <Text style={styles.headerSubtitle}>Export Configuration</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Cog6ToothIcon size={24} color="#111827" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: project.thumbnail }}
              style={styles.previewImage}
            />
          </View>
        </View>

        {/* Theme Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Theme</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {getAllThemes().map((theme) => (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  selectedTheme?.id === theme.id && styles.themeCardSelected,
                ]}
                onPress={() => setSelectedTheme(theme)}
              >
                <View style={styles.themeColorPreview}>
                  {theme.palette.slice(0, 4).map((color, index) => (
                    <View
                      key={index}
                      style={[styles.colorBlock, { backgroundColor: color }]}
                    />
                  ))}
                </View>
                <Text style={styles.themeName} numberOfLines={1}>
                  {theme.name}
                </Text>
                {selectedTheme?.id === theme.id && (
                  <View style={styles.themeCheckmark}>
                    <CheckCircleIcon size={20} color="#3B82F6" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Export Settings Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Settings</Text>
          <TouchableOpacity
            style={styles.settingsSummaryCard}
            onPress={() => setShowSettings(true)}
          >
            <View style={styles.settingsSummaryRow}>
              <Text style={styles.settingsSummaryLabel}>Resolution:</Text>
              <Text style={styles.settingsSummaryValue}>{exportSettings.outputResolution.label}</Text>
            </View>
            <View style={styles.settingsSummaryRow}>
              <Text style={styles.settingsSummaryLabel}>Pixelation:</Text>
              <Text style={styles.settingsSummaryValue}>{exportSettings.pixelationSize.label}</Text>
            </View>
            <View style={styles.settingsSummaryRow}>
              <Text style={styles.settingsSummaryLabel}>Dither:</Text>
              <Text style={styles.settingsSummaryValue}>{exportSettings.ditherIntensity.label}</Text>
            </View>
            <View style={styles.settingsSummaryRow}>
              <Text style={styles.settingsSummaryLabel}>Edge Detection:</Text>
              <Text style={styles.settingsSummaryValue}>{exportSettings.edgeDetection.label}</Text>
            </View>
            <View style={styles.settingsSummaryRow}>
              <Text style={styles.settingsSummaryLabel}>Contrast:</Text>
              <Text style={styles.settingsSummaryValue}>{exportSettings.contrast.label}</Text>
            </View>
            <View style={styles.settingsSummaryRow}>
              <Text style={styles.settingsSummaryLabel}>Saturation:</Text>
              <Text style={styles.settingsSummaryValue}>{exportSettings.saturation.label}</Text>
            </View>
            <View style={styles.settingsTapHint}>
              <Cog6ToothIcon size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.settingsTapHintText}>Tap to customize</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Hidden MapView for re-capture */}
      <View style={styles.hiddenMap}>
        <View ref={mapContainerRef} collapsable={false}>
          <MapView
            style={styles.map}
            region={project.region}
            customMapStyle={MAP_STYLE_NO_LABELS}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            toolbarEnabled={false}
          />
        </View>
      </View>

      {/* Export Button */}
      <View style={styles.footer}>
        {exporting ? (
          <View style={styles.exportingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.exportingText}>{exportProgress}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExport}
          >
            <ShareIcon size={22} color="#fff" strokeWidth={2} />
            <Text style={styles.exportButtonText}>Generate Export</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Export Settings Sheet */}
      <ExportSettingsSheet
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        settings={exportSettings}
        onUpdateSettings={(newSettings) =>
          setExportSettings({ ...exportSettings, ...newSettings })
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  settingsButton: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  previewSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  previewContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  themeCard: {
    width: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  themeCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  themeColorPreview: {
    flexDirection: 'row',
    height: 32,
    marginBottom: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  colorBlock: {
    flex: 1,
  },
  themeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  themeCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 100,
  },
  optionCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  hiddenMap: {
    position: 'absolute',
    left: -10000,
    width: 800,
    height: 800,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  exportingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7280',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  exportingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsSummaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  settingsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingsSummaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  settingsSummaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  settingsTapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  settingsTapHintText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default ExportScreen;
