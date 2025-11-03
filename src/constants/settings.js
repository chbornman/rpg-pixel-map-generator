// ======================
// CAPTURE SETTINGS (MapScreen)
// ======================

// Aspect ratio options for viewport
export const ASPECT_RATIOS = {
  SQUARE: { label: 'Square (1:1)', value: '1:1', ratio: 1 },
  WIDE: { label: 'Wide (16:9)', value: '16:9', ratio: 16 / 9 },
  PORTRAIT: { label: 'Portrait (9:16)', value: '9:16', ratio: 9 / 16 },
  GAMEBOY: { label: 'Game Boy (10:9)', value: '10:9', ratio: 10 / 9 },
};

// ======================
// EXPORT SETTINGS (ExportScreen)
// ======================

// Pixelation size presets (as array for selection UI)
export const PIXELATION_SIZES_ARRAY = [
  { label: '16px', value: 16 },
  { label: '24px', value: 24 },
  { label: '32px', value: 32 },
  { label: '48px', value: 48 },
  { label: '64px', value: 64 },
  { label: '80px', value: 80 },
  { label: '96px', value: 96 },
  { label: '128px', value: 128 },
  { label: '160px', value: 160 },
  { label: '192px', value: 192 },
];

// Pixelation size presets (as object for defaults)
export const PIXELATION_SIZES = {
  TINY: PIXELATION_SIZES_ARRAY[0],      // 16px
  SMALL: PIXELATION_SIZES_ARRAY[1],     // 24px
  MEDIUM: PIXELATION_SIZES_ARRAY[2],    // 32px
  LARGE: PIXELATION_SIZES_ARRAY[3],     // 48px
  XLARGE: PIXELATION_SIZES_ARRAY[4],    // 64px
  XXLARGE: PIXELATION_SIZES_ARRAY[5],   // 80px
  HUGE: PIXELATION_SIZES_ARRAY[7],      // 128px
  MASSIVE: PIXELATION_SIZES_ARRAY[9],   // 192px
};

// Output resolution options (as array for selection UI)
export const OUTPUT_RESOLUTIONS_ARRAY = [
  { label: '512px', value: 512 },
  { label: '1024px', value: 1024 },
  { label: '2048px', value: 2048 },
  { label: '4096px', value: 4096 },
];

// Output resolution options (as object for defaults)
export const OUTPUT_RESOLUTIONS = {
  SMALL: OUTPUT_RESOLUTIONS_ARRAY[0],
  MEDIUM: OUTPUT_RESOLUTIONS_ARRAY[1],
  LARGE: OUTPUT_RESOLUTIONS_ARRAY[2],
  XLARGE: OUTPUT_RESOLUTIONS_ARRAY[3],
};

// Dithering intensity options (0-1 range)
export const DITHER_INTENSITIES_ARRAY = [
  { label: 'None', value: 0 },
  { label: 'Low', value: 0.2 },
  { label: 'Medium', value: 0.4 },
  { label: 'High', value: 0.7 },
  { label: 'Maximum', value: 1.0 },
];

export const DITHER_INTENSITIES = {
  NONE: DITHER_INTENSITIES_ARRAY[0],
  LOW: DITHER_INTENSITIES_ARRAY[1],
  MEDIUM: DITHER_INTENSITIES_ARRAY[2],
  HIGH: DITHER_INTENSITIES_ARRAY[3],
  MAX: DITHER_INTENSITIES_ARRAY[4],
};

// Edge detection types
export const EDGE_DETECTION_ARRAY = [
  { label: 'None', value: 'none', description: 'No edge enhancement' },
  { label: 'Soft', value: 'soft', description: 'Subtle edge definition' },
  { label: 'Strong', value: 'strong', description: 'Bold outlines' },
  { label: 'Selective', value: 'selective', description: 'Adaptive edge detection' },
];

export const EDGE_DETECTION = {
  NONE: EDGE_DETECTION_ARRAY[0],
  SOFT: EDGE_DETECTION_ARRAY[1],
  STRONG: EDGE_DETECTION_ARRAY[2],
  SELECTIVE: EDGE_DETECTION_ARRAY[3],
};

// Contrast levels (multiplier)
export const CONTRAST_LEVELS_ARRAY = [
  { label: '0.7x', value: 0.7 },
  { label: '0.85x', value: 0.85 },
  { label: '1.0x', value: 1.0 },
  { label: '1.15x', value: 1.15 },
  { label: '1.3x', value: 1.3 },
  { label: '1.5x', value: 1.5 },
];

export const CONTRAST_LEVELS = {
  LOW: CONTRAST_LEVELS_ARRAY[0],
  MEDIUM_LOW: CONTRAST_LEVELS_ARRAY[1],
  NORMAL: CONTRAST_LEVELS_ARRAY[2],
  MEDIUM_HIGH: CONTRAST_LEVELS_ARRAY[3],
  HIGH: CONTRAST_LEVELS_ARRAY[4],
  VERY_HIGH: CONTRAST_LEVELS_ARRAY[5],
};

// Saturation levels (multiplier)
export const SATURATION_LEVELS_ARRAY = [
  { label: '0.0x (B&W)', value: 0 },
  { label: '0.5x', value: 0.5 },
  { label: '0.7x', value: 0.7 },
  { label: '1.0x', value: 1.0 },
  { label: '1.2x', value: 1.2 },
  { label: '1.5x', value: 1.5 },
];

export const SATURATION_LEVELS = {
  NONE: SATURATION_LEVELS_ARRAY[0],
  LOW: SATURATION_LEVELS_ARRAY[1],
  MEDIUM: SATURATION_LEVELS_ARRAY[2],
  NORMAL: SATURATION_LEVELS_ARRAY[3],
  HIGH: SATURATION_LEVELS_ARRAY[4],
  VERY_HIGH: SATURATION_LEVELS_ARRAY[5],
};

// ======================
// DEFAULT SETTINGS
// ======================

// Map feature toggles
export const DEFAULT_MAP_FEATURES = {
  roads: true,
  buildings: true,
  water: true,
  parks: true,
  transit: false,
  landscape: true,
};

// Capture defaults (stored in projects)
export const DEFAULT_CAPTURE_SETTINGS = {
  aspectRatio: ASPECT_RATIOS.SQUARE,
  showGrid: false,
  mapFeatures: DEFAULT_MAP_FEATURES,
};

// Export defaults (not stored, used as UI defaults)
export const DEFAULT_EXPORT_SETTINGS = {
  pixelationSize: PIXELATION_SIZES.MEDIUM,
  outputResolution: OUTPUT_RESOLUTIONS.MEDIUM,
  ditherIntensity: DITHER_INTENSITIES.MEDIUM,
  edgeDetection: EDGE_DETECTION.NONE,
  contrast: CONTRAST_LEVELS.NORMAL,
  saturation: SATURATION_LEVELS.NORMAL,
};
