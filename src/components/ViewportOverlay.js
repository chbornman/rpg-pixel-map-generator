import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ViewportOverlay = ({ aspectRatio = 1 }) => {
  // Calculate viewport dimensions based on aspect ratio
  const calculateViewportDimensions = () => {
    const maxWidth = SCREEN_WIDTH * 0.8;
    const maxHeight = SCREEN_HEIGHT * 0.6;

    let viewportWidth, viewportHeight;

    if (aspectRatio >= 1) {
      // Landscape or square
      viewportWidth = Math.min(maxWidth, maxHeight * aspectRatio);
      viewportHeight = viewportWidth / aspectRatio;
    } else {
      // Portrait
      viewportHeight = Math.min(maxHeight, maxWidth / aspectRatio);
      viewportWidth = viewportHeight * aspectRatio;
    }

    return { width: viewportWidth, height: viewportHeight };
  };

  const { width, height } = calculateViewportDimensions();

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Dimmed overlay - top */}
      <View style={[styles.dimOverlay, { height: (SCREEN_HEIGHT - height) / 2 }]} />

      {/* Middle row with side dims and viewport */}
      <View style={styles.middleRow}>
        <View style={[styles.dimOverlay, { width: (SCREEN_WIDTH - width) / 2 }]} />

        {/* Viewport frame */}
        <View style={[styles.viewport, { width, height }]} />

        <View style={[styles.dimOverlay, { width: (SCREEN_WIDTH - width) / 2 }]} />
      </View>

      {/* Dimmed overlay - bottom */}
      <View style={[styles.dimOverlay, { height: (SCREEN_HEIGHT - height) / 2 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  middleRow: {
    flexDirection: 'row',
  },
  dimOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  viewport: {
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
});

export default ViewportOverlay;
