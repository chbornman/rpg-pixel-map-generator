// Aspect ratio options for viewport
export const ASPECT_RATIOS = {
  SQUARE: { label: 'Square (1:1)', value: '1:1', ratio: 1 },
  WIDE: { label: 'Wide (16:9)', value: '16:9', ratio: 16 / 9 },
  PORTRAIT: { label: 'Portrait (9:16)', value: '9:16', ratio: 9 / 16 },
  GAMEBOY: { label: 'Game Boy (10:9)', value: '10:9', ratio: 10 / 9 },
};

// Pixelation size presets (as array for selection UI)
export const PIXELATION_SIZES_ARRAY = [
  { label: '16px', value: 16 },
  { label: '24px', value: 24 },
  { label: '32px', value: 32 },
  { label: '48px', value: 48 },
  { label: '64px', value: 64 },
];

// Pixelation size presets (as object for defaults)
export const PIXELATION_SIZES = {
  TINY: PIXELATION_SIZES_ARRAY[0],
  SMALL: PIXELATION_SIZES_ARRAY[1],
  MEDIUM: PIXELATION_SIZES_ARRAY[2],
  LARGE: PIXELATION_SIZES_ARRAY[3],
  XLARGE: PIXELATION_SIZES_ARRAY[4],
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

// Default settings
export const DEFAULT_SETTINGS = {
  aspectRatio: ASPECT_RATIOS.SQUARE,
  pixelationSize: PIXELATION_SIZES.MEDIUM,
  outputResolution: OUTPUT_RESOLUTIONS.MEDIUM,
  showGrid: false,
};
