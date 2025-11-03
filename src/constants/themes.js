// Pixel art theme definitions - color palettes only
export const THEMES = {
  CLASSIC_JRPG: {
    id: 'classic-jrpg',
    name: 'Classic JRPG',
    description: '16-bit era vibrant colors',
    palette: [
      '#0f380f', '#1a4d1a', '#2d6b2d', '#4a9d4a',
      '#6bc96b', '#8ae68a', '#a8ffa8', '#c0ffc0',
      '#1a4d9d', '#2d6bc9', '#4a9dff', '#6bc9ff',
      '#8ae6ff', '#c0f0ff', '#8b4513', '#a0522d',
      '#cd853f', '#daa520', '#f4a460', '#ffd700',
      '#ff6347', '#ff4500', '#dc143c', '#b22222',
      '#ffffff', '#d3d3d3', '#a9a9a9', '#696969',
      '#404040', '#2f2f2f', '#1a1a1a', '#000000',
    ],
    colorCount: 32,
  },
  GAMEBOY: {
    id: 'gameboy',
    name: 'Game Boy Classic',
    description: '4-color green monochrome',
    palette: [
      '#0f380f', // Darkest
      '#306230', // Dark
      '#8bac0f', // Light
      '#9bbc0f', // Lightest
    ],
    colorCount: 4,
  },
  NES_ADVENTURE: {
    id: 'nes-adventure',
    name: 'NES Adventure',
    description: '8-bit limited palette',
    palette: [
      '#000000', '#fcfcfc', '#f8f8f8', '#bcbcbc',
      '#7c7c7c', '#a4e4fc', '#3cbcfc', '#0078f8',
      '#0000fc', '#00b800', '#00a800', '#00d800',
      '#58f898', '#a4a4a4', '#d8b040', '#fcfc00',
    ],
    colorCount: 16,
  },
  MODERN_PIXEL: {
    id: 'modern-pixel',
    name: 'Modern Pixel',
    description: 'Indie game expanded palette',
    palette: [
      '#140c1c', '#442434', '#30346d', '#4e4a4e',
      '#854c30', '#346524', '#d04648', '#757161',
      '#597dce', '#d27d2c', '#8595a1', '#6daa2c',
      '#d2aa99', '#6dc2ca', '#dad45e', '#deeed6',
      '#2e1f27', '#3a4466', '#4e9f64', '#8cd612',
      '#e4943a', '#9e4539', '#cd683d', '#e6c2a2',
      '#5a3921', '#8b6d46', '#c09473', '#ddc9a3',
      '#4d9be6', '#8ad2e6', '#b4e6f0', '#f0fcfc',
      '#3e2137', '#73464c', '#a53030', '#e03c28',
      '#e07040', '#ffa040', '#ffe762', '#cfe2f2',
      '#8b9bb4', '#5a6988', '#3a4466', '#262b44',
      '#181425', '#b86f50', '#f2a65a', '#ffe478',
      '#cfe2f2', '#8b9bb4', '#5a6988', '#3a4466',
      '#4d9be6', '#22d5de', '#66ffd4', '#e0feff',
    ],
    colorCount: 64,
  },
  MINIMAL_RETRO: {
    id: 'minimal-retro',
    name: 'Minimal Retro',
    description: '8-color pastel flat design',
    palette: [
      '#e6d690', // Light tan (grass/land)
      '#93b7be', // Light blue (water)
      '#5b6057', // Dark gray (roads)
      '#f2e5d5', // Off white (buildings)
      '#d4a59a', // Dusty pink (accents)
      '#a6c48a', // Sage green (parks)
      '#4a5859', // Charcoal (shadows)
      '#ffffff', // White (highlights)
    ],
    colorCount: 8,
  },
};

// Helper to get theme by id
export const getThemeById = (id) => {
  return Object.values(THEMES).find((theme) => theme.id === id) || THEMES.CLASSIC_JRPG;
};

// Get all themes as array
export const getAllThemes = () => Object.values(THEMES);
