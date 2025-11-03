// Aspect ratio options for viewport
export const ASPECT_RATIOS = {
  SQUARE: { label: 'Square (1:1)', value: '1:1', ratio: 1 },
  WIDE: { label: 'Wide (16:9)', value: '16:9', ratio: 16 / 9 },
  PORTRAIT: { label: 'Portrait (9:16)', value: '9:16', ratio: 9 / 16 },
  GAMEBOY: { label: 'Game Boy (10:9)', value: '10:9', ratio: 10 / 9 },
};

// Pixelation size presets
export const PIXELATION_SIZES = {
  TINY: { label: 'Tiny', value: 80 },
  SMALL: { label: 'Small', value: 120 },
  MEDIUM: { label: 'Medium', value: 160 },
  LARGE: { label: 'Large', value: 240 },
};

// Output resolution options
export const OUTPUT_RESOLUTIONS = {
  SMALL: { label: '320px', value: 320 },
  MEDIUM: { label: '640px', value: 640 },
  LARGE: { label: '960px', value: 960 },
  HD: { label: '1280px', value: 1280 },
};

// Default settings
export const DEFAULT_SETTINGS = {
  aspectRatio: ASPECT_RATIOS.SQUARE,
  pixelationSize: PIXELATION_SIZES.MEDIUM,
  outputResolution: OUTPUT_RESOLUTIONS.MEDIUM,
  showGrid: false,
};
