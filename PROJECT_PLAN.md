# RPG Pixel Map Generator - Project Plan

## Overview
Convert real-world map locations into pixel art RPG maps with customizable themes and settings.

---

## Core Features

### 1. Map View & Capture
- **Map Display**
  - Remove all text labels, symbols, and POI markers
  - Keep: roads, water bodies, terrain, buildings (shapes only)
  - Custom map style with minimal/no labels

- **Viewport Control**
  - Adjustable aspect ratio overlay showing capture area
  - Visual frame/border to show exact capture zone
  - Pan and zoom within the viewport

### 2. Settings Drawer

#### Capture Settings
- **Viewport Aspect Ratio**
  - Square (1:1) - Classic RPG
  - Wide (16:9) - Modern widescreen
  - Portrait (9:16) - Mobile-friendly
  - Game Boy (10:9)
  - Custom (user input)

- **Pixelation Size**
  - Tiny (80px base) - Heavy pixelation
  - Small (120px base)
  - Medium (160px base) - Default
  - Large (240px base)
  - Custom slider (60-300px)

- **Output Resolution**
  - 320x320 (small)
  - 640x640 (medium) - Default
  - 960x960 (large)
  - 1280x1280 (HD)

#### Map Settings
- Map type selector (Standard/Satellite/Hybrid)
- Show/hide viewport grid overlay
- Snap to compass directions (N/S/E/W alignment)

### 3. Image Capture Flow

1. User positions map with viewport overlay
2. Tap "Capture" button
3. Screenshot taken (no labels/text)
4. Basic pixelation applied
5. Image saved to gallery with metadata (location, date, settings)
6. Navigate to theme selection screen

### 4. Theme Selection Screen

After capture, user selects from predefined themes:

#### Theme 1: **Classic JRPG** (16-bit era)
- **Palette**: Vibrant, saturated colors (SNES-style)
- **Style**:
  - Water: Bright blue with animated-style waves pattern
  - Grass/terrain: Rich green with dithering
  - Roads: Brown/tan cobblestone pattern
  - Buildings: Red roofs, white/beige walls
- **Colors**: 32-color palette
- **Edges**: Soft, minimal outlining

#### Theme 2: **Game Boy Classic**
- **Palette**: 4-color green monochrome (#0f380f, #306230, #8bac0f, #9bbc0f)
- **Style**:
  - High contrast dithering
  - Checkerboard patterns for water
  - Heavy use of dot patterns
  - Strong edge contrast
- **Colors**: 4 shades of green
- **Edges**: High contrast, thick edges

#### Theme 3: **NES Adventure** (8-bit)
- **Palette**: Limited NES color palette (~16 colors)
- **Style**:
  - Water: Solid blue with sparse white highlights
  - Grass: Solid green, minimal detail
  - Roads: Simple brown paths
  - Buildings: Blocky, solid colors
- **Colors**: 16-color NES palette
- **Edges**: Thick black outlines on everything

#### Theme 4: **Modern Pixel** (Indie game style)
- **Palette**: Expanded modern pixel art colors (64+ colors)
- **Style**:
  - Water: Gradient blues with pixel shading
  - Terrain: Multi-tone grass with detail
  - Roads: Detailed stone/asphalt texture
  - Buildings: Detailed with shadows and highlights
- **Colors**: 64-color palette
- **Edges**: Selective outlines, pixel-perfect details

#### Theme 5: **Minimal Retro**
- **Palette**: 8 colors maximum, pastel tones
- **Style**:
  - Flat colors, no dithering
  - Water: Single solid blue
  - Grass: Single tan/yellow
  - Roads: Dark brown
  - Buildings: Simple geometric shapes
- **Colors**: 8 flat colors
- **Edges**: No outlines, color separation only

### 5. Gallery/Collection Page

- **Layout**: Grid of saved images (2-3 columns)
- **Each Item Shows**:
  - Thumbnail of pixel map
  - Theme applied
  - Capture date/time
  - Location name/coordinates
  - Settings used (aspect ratio, pixelation size)

- **Actions**:
  - Tap to view full screen
  - Re-apply different theme to existing capture
  - Delete image
  - Export/share image
  - View on map (return to original location)

### 6. Navigation Structure

```
Bottom Tabs:
├── Map (Capture) - Main screen
├── Gallery - Saved images grid
└── Settings - Global app settings
```

---

## Technical Implementation Plan

### Phase 1: Map Styling
- [ ] Configure MapView with custom style to remove labels
- [ ] Add overlay showing viewport/capture area
- [ ] Implement aspect ratio selector

### Phase 2: Settings Drawer
- [ ] Create slide-out settings drawer component
- [ ] Add pixelation size controls
- [ ] Add aspect ratio selector
- [ ] Add output resolution selector
- [ ] Save settings to AsyncStorage

### Phase 3: Capture System
- [ ] Implement viewport-only capture (not full screen)
- [ ] Save captured images to device storage
- [ ] Store metadata (location, settings, timestamp)
- [ ] Navigate to theme selection after capture

### Phase 4: Theme System
- [ ] Create theme engine with color palette mapping
- [ ] Implement 5 distinct theme processors:
  - Classic JRPG theme
  - Game Boy theme
  - NES Adventure theme
  - Modern Pixel theme
  - Minimal Retro theme
- [ ] Theme preview/selection UI
- [ ] Apply theme to captured image

### Phase 5: Gallery
- [ ] Create gallery screen with grid layout
- [ ] Implement local storage for images
- [ ] Add re-theme capability (apply different theme to saved image)
- [ ] Add delete functionality
- [ ] Add export/share functionality

### Phase 6: Polish
- [ ] Loading states during processing
- [ ] Error handling
- [ ] Performance optimization
- [ ] Tutorial/onboarding
- [ ] Settings persistence

---

## Data Structure

### Saved Image Object
```javascript
{
  id: "unique-id",
  originalImage: "file://...",  // Base pixelated capture
  themedImage: "file://...",     // With theme applied
  theme: "classic-jrpg",
  location: {
    latitude: 37.78825,
    longitude: -122.4324,
    name: "San Francisco, CA"
  },
  settings: {
    aspectRatio: "1:1",
    pixelationSize: 160,
    outputResolution: 640
  },
  timestamp: "2025-11-02T19:30:00Z"
}
```

---

## Future Enhancements (Not in current scope)

### Export Enhancements
- [ ] Export metadata - Embed palette info in PNG metadata
- [ ] Indexed color mode - Export as indexed PNGs (palette-based) for better pixel art tool compatibility
- [ ] Multiple export sizes - Generate 1x, 2x, 4x versions simultaneously
- [ ] Share to social media with proper preview

### Feature Development
- [ ] Custom tile upload system
- [ ] Feature detection (AI-powered water/road/building recognition)
- [ ] Animation export (animated water tiles, etc.)
- [ ] Custom palette creator
- [ ] Tile-by-tile manual editing
- [ ] Export as tilemap data for game engines (JSON/CSV)

---

## UI/UX Notes

- Keep capture screen minimal (map + viewport + capture button)
- Settings drawer slides in from right
- Theme selection as modal/full screen after capture
- Gallery with quick actions on long-press
- Visual feedback during processing (loading spinner)
- Preview before saving to gallery
