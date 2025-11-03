# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**RPG Pixel Map Generator** - An Expo/React Native app that converts real-world map locations into pixel art RPG maps with customizable themes. Users capture map views as lightweight projects, then export them on-demand with different themes and resolutions.

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

## Architecture Overview

### Core Concept: Projects vs Exports

The app follows an **infrastructure-first, metadata-driven** architecture:

- **Projects** = Captured map metadata (lightweight, editable, ~50KB each)
- **Exports** = Rendered high-resolution images (generated on-demand, 1-10MB each)

This separation provides:
- Instant capture (no processing wait)
- Try multiple themes without re-capturing
- Adjust settings after capture
- Re-export with better resolution later
- Gallery loads instantly (thumbnails only)

### Navigation Structure

Root Stack Navigator (`AppNavigator.js`):
```
RootStack
├── Tabs (Bottom Tab Navigator)
│   ├── MapTab → MapScreen
│   └── Gallery → GalleryScreen
├── Export → ExportScreen (card presentation)
└── ExportsLibrary → ExportsLibraryScreen (card presentation)
```

**User Flow**:
1. **Capture**: MapScreen → Save project (metadata + thumbnail) → Gallery
2. **Export**: Gallery → Tap project → ExportScreen → Generate high-res export → ExportsLibrary
3. **View/Share**: ExportsLibrary → View/share rendered images

### Data Architecture

#### Project Schema (`constants/schemas.js`)
```javascript
{
  id, type: 'project', version: 1,
  region: { lat, lng, latDelta, lngDelta },  // Full zoom state!
  location: { lat, lng, name, address },
  settings: { aspectRatio, pixelationSize, outputResolution, showGrid },
  previewTheme: 'theme_id' | null,
  thumbnail: 'file://path/to/256x256.png',
  timestamp, lastModified, notes
}
```

#### Export Schema
```javascript
{
  id, type: 'export', version: 1,
  projectId: 'links_to_project',
  theme: 'theme_id',
  resolution: { width, height },
  pixelationSize: 32,
  imagePath: 'file://path/to/export.png',
  fileSize: 2048576,
  timestamp, exportDuration
}
```

### Storage Services

#### `projectStorage.js`
- `saveProject()` - Save capture metadata + thumbnail (~50KB)
- `getAllProjects()` - Get all projects sorted by date
- `getProject(id)` - Get single project
- `updateProject(id, updates)` - Modify settings before export
- `deleteProject(id)` - Remove project + thumbnail + linked exports
- `duplicateProject(id)` - Clone project with new ID

#### `exportStorage.js`
- `saveExport()` - Save rendered output metadata
- `getExportsForProject(projectId)` - All exports from one project
- `getAllExports()` - All exports across projects
- `deleteExport(id)` - Remove export image + metadata
- `deleteExportsForProject(projectId)` - Remove all exports for a project

#### `cacheManager.js`
- `ensureDirectories()` - Create storage directories on init
- `getStorageReport()` - Disk usage statistics
- `clearTempFiles()` - Clean up processing artifacts
- `cleanOrphanedFiles()` - Remove files not in metadata
- `copyToStorage()` - Move files to permanent storage

#### `migrationManager.js`
- `needsMigration()` - Check if upgrade needed
- `migrateFromV0()` - Convert old format to projects/exports
- `getCurrentVersion()` - Get schema version

### Directory Structure

```
FileSystem.documentDirectory/rpg_maps/
├── projects/       (unused - metadata in AsyncStorage)
├── exports/        Full-resolution exported images
├── thumbnails/     256x256 preview images
└── cache/          Temporary processing files
```

### Image Processing Pipeline

#### Capture Flow (MapScreen.js:56-117)
1. `captureRef` captures MapView
2. `generateThumbnailWithAspect` creates 256x256 preview
3. `saveProject` saves metadata + thumbnail
4. **No pixelation or theme application** - instant!

#### Export Flow (ExportScreen.js:68-138)
1. Load project metadata
2. Render hidden MapView with saved region/zoom
3. `captureRef` re-captures at full resolution
4. `pixelateImage` - 2-step resize (expo-image-manipulator)
5. `applyTheme` - Skia shader color mapping
6. `saveExport` - Copy to permanent storage with metadata

### Theme Application

**GLSL Shader Pattern** (`themeProcessor.js`):
```javascript
1. Load image → Skia.Image.MakeImageFromEncoded()
2. Create runtime shader → createPaletteShader(palette)
3. Create image shader → image.makeShaderOptions()
4. Combine → runtimeEffect.makeShaderWithChildren([], [imageShader])
5. Render → surface.getCanvas().drawRect()
6. Snapshot → makeImageSnapshot().encodeToBase64()
```

**Critical**: Use `FilterMode.Nearest` and `MipmapMode.None` to preserve sharp pixel edges.

### Screen Responsibilities

#### MapScreen
- Display Google Maps with custom styling
- Viewport overlay with aspect ratio
- Capture map view → generate thumbnail → save project
- Theme picker (preview only, doesn't apply theme)
- Settings drawer, location search

#### GalleryScreen
- Display project thumbnails in grid
- Show: location name, capture date, preview theme, settings
- Actions: Export, Duplicate, Delete
- Navigate to ExportScreen or ExportsLibrary

#### ExportScreen
- Load project metadata
- Hidden MapView for re-capture
- Theme/resolution/pixelation selectors
- Generate high-res export on demand
- Show progress: "Capturing...", "Pixelating...", "Applying theme..."
- Save to ExportsLibrary

#### ExportsLibraryScreen
- Display all rendered exports in grid
- Show: theme, resolution, file size, date
- Actions: View Fullscreen, Share, Delete
- Statistics: total exports, storage used, avg duration

### Settings System

`constants/settings.js` exports:
- `ASPECT_RATIOS` - Object with named ratios
- `PIXELATION_SIZES` / `PIXELATION_SIZES_ARRAY` - Object and array formats
- `OUTPUT_RESOLUTIONS` / `OUTPUT_RESOLUTIONS_ARRAY` - Object and array formats
- `DEFAULT_SETTINGS` - Default configuration

### Migration System

On app startup (`App.js`):
1. `ensureDirectories()` - Create storage folders
2. `needsMigration()` - Check for old data format
3. If needed: Show `MigrationScreen` → `migrateFromV0()`
4. Convert old maps → projects + exports
5. Set `SCHEMA_VERSION` to mark complete

### Map Customization

`mapStyle.js` contains Google Maps JSON style that removes all labels, POIs, and text while preserving roads, water, terrain, and building shapes.

## Key Technical Patterns

### Thumbnail Generation
- Use `generateThumbnailWithAspect` for previews
- 256x256 size balances quality and storage
- Maintains aspect ratio for accurate preview

### Hidden MapView Pattern
ExportScreen renders MapView off-screen for re-capture:
```javascript
<View style={{ position: 'absolute', left: -10000, width: 800, height: 800 }}>
  <MapView region={project.region} ... />
</View>
```

### Versioned Schemas
All data includes `version: 1` field for future migrations. Migration manager handles upgrades gracefully.

## Important Constraints

- **Android Google Maps**: API key in `app.json` under `android.config.googleMaps.apiKey`
- **New Architecture**: Verify native module compatibility with Expo SDK 54
- **Image formats**: PNG only (lossless compression for pixel art)
- **Storage**: Projects in AsyncStorage, files in document directory

## Common Development Patterns

### Adding New Themes
1. Define palette in `constants/themes.js`
2. Set colorCount and style parameters
3. Shader automatically handles any palette size
4. No changes needed to export flow

### Modifying Capture Settings
1. Add to `constants/settings.js`
2. Update `DEFAULT_SETTINGS`
3. Update `SettingsSheet` UI
4. Settings automatically persist in projects

### Adding Export Formats
1. Create new processor in `utils/`
2. Add format selector to ExportScreen
3. Update `saveExport` to handle new format
4. Extend export schema if needed

## Debugging Tips

- Check migration status: `getMigrationStatus()`
- View storage report: `getStorageReport()`
- Clean orphaned files: `cleanOrphanedFiles()`
- Check project count: `await getAllProjects()` then `.length`
- Check export count: `await getAllExports()` then `.length`

## Project Status

Infrastructure-first refactor: **Complete** ✓
- Projects/exports separation ✓
- Migration system ✓
- All screens updated ✓
- Thumbnail generation ✓
- On-demand export rendering ✓
