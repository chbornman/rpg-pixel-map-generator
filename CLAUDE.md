# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RPG Pixel Map Generator** - An Expo/React Native app that converts real-world map locations into pixel art RPG maps with customizable themes. Users capture map views, apply pixelation, and then select from 5 retro gaming themes (Classic JRPG, Game Boy, NES Adventure, Modern Pixel, Minimal Retro).

**Important**: Expo New Architecture is enabled (`newArchEnabled: true` in app.json). This affects native module compatibility.

## Development Commands

```bash
# Start development server
npm start

# Run on platforms
npm run android
npm run ios
npm run web
```

## Architecture

### Navigation Flow
The app uses a hybrid navigation structure combining bottom tabs and stacks:

1. **Bottom Tab Navigator** (`AppNavigator.js`):
   - "MapTab" → Contains a nested Stack Navigator
   - "Gallery" → Direct screen component
   - Note: Tab bar is currently hidden (`tabBarStyle.display: 'none'`)

2. **Map Stack Navigator**:
   - "Map" screen (MapScreen) → "ThemeSelection" screen
   - This allows the capture → theme selection flow while maintaining tab navigation

**Navigation pattern**: User captures map on MapScreen → navigates to ThemeSelectionScreen with image data → returns to Gallery tab to view saved images.

**Preview mode**: MapScreen includes a theme picker modal that enables direct theme application during capture, bypassing ThemeSelectionScreen for a faster workflow.

### Image Processing Pipeline

Three-stage processing using different libraries for optimal results:

1. **Capture Stage** (MapScreen.js):
   - `react-native-view-shot` captures the MapView component
   - Captures viewport overlay area only (not full screen)

2. **Pixelation Stage** (`themeProcessor.js:pixelateImage`):
   - `expo-image-manipulator` performs 2-step resize (down to pixelationSize, up to outputSize)
   - Creates blocky pixel effect without color mapping

3. **Theme Application** (`themeProcessor.js:applyTheme`):
   - `@shopify/react-native-skia` applies color palette mapping via GLSL shaders
   - Runtime shader matches each pixel to closest palette color using Euclidean distance
   - Critical: Skia operations must run on UI thread; use offscreen surfaces for rendering

### Data Flow

Image capture passes this data structure through navigation:
```javascript
{
  imageUri: "file://...",           // Pixelated base image
  location: { latitude, longitude, name },
  settings: { aspectRatio, pixelationSize, outputResolution }
}
```

Saved images (managed via `storage.js`) include both `originalImage` (pixelated capture) and `themedImage` (with palette applied).

### Map Customization

`mapStyle.js` contains Google Maps JSON style array that removes all labels, POIs, and text while preserving roads, water, terrain, and building shapes. This is critical for clean pixelated output.

### Settings System

Settings are defined as constant objects in `constants/settings.js`:
- Each setting has `{ label, value, ratio }` structure
- `DEFAULT_SETTINGS` exported for initialization
- Settings persist via AsyncStorage (implementation in `services/storage.js`)

## Key Technical Patterns

### Viewport Overlay
The `ViewportOverlay` component uses absolute positioning with aspect ratio calculations to show the capture area. The capture uses `captureRef` on the map container, not the overlay, ensuring clean captures.

### UI Component Pattern
MapScreen uses a floating bottom bar with three sections (left/center/right controls) for ergonomic access:
- **Left**: Theme preview toggle (paint brush icon)
- **Center**: Gallery navigation + capture button (primary action)
- **Right**: Settings + search icons

Modals use bottom sheet style with backdrop dimming for Settings and Theme selection.

### Theme Engine
Themes (`constants/themes.js`) define:
- Color palettes (4-64 colors depending on retro style)
- Style parameters (ditherIntensity, edgeDetection, contrast, saturation)

The GLSL shader in `createPaletteShader()` dynamically generates shader code based on palette size, unrolling color-matching loops for performance.

### Skia Shader Pattern
```javascript
1. Load image → Skia.Image.MakeImageFromEncoded()
2. Create runtime shader → createPaletteShader(palette)
3. Create image shader → image.makeShaderOptions()
4. Combine → runtimeEffect.makeShaderWithChildren([], [imageShader])
5. Render to offscreen surface → surface.getCanvas().drawRect()
6. Snapshot and encode → makeImageSnapshot().encodeToBase64()
```

**Critical**: Use `FilterMode.Nearest` and `MipmapMode.None` when creating image shaders to preserve sharp pixel edges.

## Important Constraints

- **Android Google Maps**: API key is in `app.json` under `android.config.googleMaps.apiKey` (AIzaSyB6aNCUOKa4-i-QYocrdlCOmBtlPcudDCY)
- **New Architecture**: When adding native modules, verify compatibility with Expo SDK 54 and React Native New Architecture
- **Image formats**: All processed images use PNG format (lossless compression required for pixel art)
- **File paths**: Use `FileSystem.cacheDirectory` for temporary images, document directory for persistent storage

## Common Development Patterns

When adding new themes:
1. Define palette array in `constants/themes.js`
2. Set colorCount and style parameters
3. Shader automatically handles any palette size

When modifying capture settings:
1. Add to appropriate constants object in `constants/settings.js`
2. Update `DEFAULT_SETTINGS`
3. Update `SettingsDrawer` UI to include new controls
4. Ensure setting is passed through navigation params to ThemeSelection

## Project Status

See PROJECT_PLAN.md for full feature roadmap. Currently implemented:
- Phase 1: Map styling ✓
- Phase 2: Settings drawer ✓
- Phase 3: Capture system ✓
- Phase 4: Theme system (in progress)
- Phase 5: Gallery (partial)
