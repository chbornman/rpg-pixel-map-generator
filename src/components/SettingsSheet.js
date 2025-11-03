import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { ASPECT_RATIOS, PIXELATION_SIZES, OUTPUT_RESOLUTIONS } from '../constants/settings';

const SettingsDrawer = ({ visible, onClose, settings, onUpdateSettings }) => {
  const renderOptionButton = (option, isSelected, onPress) => (
    <TouchableOpacity
      key={option.value || option.label}
      style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );

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
            <Text style={styles.title}>Capture Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Aspect Ratio */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aspect Ratio</Text>
              <View style={styles.optionsGrid}>
                {Object.values(ASPECT_RATIOS).map((ratio) =>
                  renderOptionButton(
                    ratio,
                    settings.aspectRatio.value === ratio.value,
                    () => onUpdateSettings({ aspectRatio: ratio })
                  )
                )}
              </View>
            </View>

            {/* Pixelation Size */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pixelation Size</Text>
              <View style={styles.optionsGrid}>
                {Object.values(PIXELATION_SIZES).map((size) =>
                  renderOptionButton(
                    size,
                    settings.pixelationSize.value === size.value,
                    () => onUpdateSettings({ pixelationSize: size })
                  )
                )}
              </View>
            </View>

            {/* Output Resolution */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Output Resolution</Text>
              <View style={styles.optionsGrid}>
                {Object.values(OUTPUT_RESOLUTIONS).map((resolution) =>
                  renderOptionButton(
                    resolution,
                    settings.outputResolution.value === resolution.value,
                    () => onUpdateSettings({ outputResolution: resolution })
                  )
                )}
              </View>
            </View>

            {/* Show Grid */}
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <Text style={styles.sectionTitle}>Show Viewport Grid</Text>
                <Switch
                  value={settings.showGrid}
                  onValueChange={(value) => onUpdateSettings({ showGrid: value })}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={settings.showGrid ? '#3B82F6' : '#f4f3f4'}
                />
              </View>
            </View>
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
    maxHeight: '80%',
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 14,
    letterSpacing: 0.2,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default SettingsDrawer;
