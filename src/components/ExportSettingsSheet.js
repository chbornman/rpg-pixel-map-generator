import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  PIXELATION_SIZES_ARRAY,
  OUTPUT_RESOLUTIONS_ARRAY,
  DITHER_INTENSITIES_ARRAY,
  EDGE_DETECTION_ARRAY,
  CONTRAST_LEVELS_ARRAY,
  SATURATION_LEVELS_ARRAY,
} from '../constants/settings';

const ExportSettingsSheet = ({ visible, onClose, settings, onUpdateSettings }) => {
  const renderOptionButton = (option, isSelected, onPress) => (
    <TouchableOpacity
      key={option.value}
      style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );

  const renderSlider = (title, description, options, currentValue, onUpdate) => {
    const currentIndex = options.findIndex(opt => opt.value === currentValue);

    return (
      <View style={styles.section}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sliderValue}>{options[currentIndex]?.label}</Text>
        </View>
        <Text style={styles.sectionDescription}>{description}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={options.length - 1}
          step={1}
          value={currentIndex}
          onValueChange={(index) => onUpdate(options[Math.round(index)])}
          minimumTrackTintColor="#3B82F6"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#3B82F6"
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Export Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Output Resolution */}
            {renderSlider(
              'Output Resolution',
              'Final image width (height varies by aspect ratio)',
              OUTPUT_RESOLUTIONS_ARRAY,
              settings.outputResolution.value,
              (resolution) => onUpdateSettings({ outputResolution: resolution })
            )}

            {/* Pixelation Size */}
            {renderSlider(
              'Pixelation Size',
              'Pixel size - smaller values create more detailed images',
              PIXELATION_SIZES_ARRAY,
              settings.pixelationSize.value,
              (size) => onUpdateSettings({ pixelationSize: size })
            )}

            {/* Dither Intensity */}
            {renderSlider(
              'Dither Intensity',
              'Adds noise to smooth color transitions between palette colors',
              DITHER_INTENSITIES_ARRAY,
              settings.ditherIntensity.value,
              (dither) => onUpdateSettings({ ditherIntensity: dither })
            )}

            {/* Edge Detection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Edge Detection</Text>
              <Text style={styles.sectionDescription}>
                Enhance outlines and boundaries between features
              </Text>
              <View style={styles.optionsGrid}>
                {EDGE_DETECTION_ARRAY.map((edge) =>
                  renderOptionButton(
                    edge,
                    settings.edgeDetection.value === edge.value,
                    () => onUpdateSettings({ edgeDetection: edge })
                  )
                )}
              </View>
            </View>

            {/* Contrast */}
            {renderSlider(
              'Contrast',
              'Adjust the difference between light and dark areas',
              CONTRAST_LEVELS_ARRAY,
              settings.contrast.value,
              (contrast) => onUpdateSettings({ contrast: contrast })
            )}

            {/* Saturation */}
            {renderSlider(
              'Saturation',
              'Adjust color intensity (0.0x = black & white)',
              SATURATION_LEVELS_ARRAY,
              settings.saturation.value,
              (saturation) => onUpdateSettings({ saturation: saturation })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
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
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  content: {
    maxHeight: '100%',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 0.2,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    minWidth: 85,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  optionTextSelected: {
    color: '#fff',
  },
});

export default ExportSettingsSheet;
