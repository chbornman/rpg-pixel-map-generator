# RPG Pixel Map Generator

Transform real-world locations into nostalgic pixel art RPG maps! Capture any place on Earth and instantly convert it into a retro game-style map with customizable themes and resolutions.

![RPG Pixel Map Generator](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-blue)
![Expo SDK](https://img.shields.io/badge/Expo%20SDK-54-000020?logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.76.5-61DAFB?logo=react)

## Features

- **Real-World Capture**: Select any location using Google Maps and capture it as a project
- **Multiple Themes**: Apply various retro gaming color palettes (Game Boy, NES, SNES, and more)
- **Customizable Output**: Choose aspect ratios, pixel sizes, and export resolutions
- **Lightweight Projects**: Save captures as small metadata files (~50KB) with instant thumbnails
- **On-Demand Export**: Generate high-resolution pixel art exports only when needed (1-10MB)
- **Cross-Platform**: Works on iOS, Android, and Web via Expo

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Studio for mobile testing
- Google Maps API key for Android

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rpg-pixel-map-generator.git
cd rpg-pixel-map-generator
```

2. Install dependencies:
```bash
npm install
```

3. Configure Google Maps API (Android only):
   - Get an API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Add it to `app.json`:
   ```json
   {
     "expo": {
       "android": {
         "config": {
           "googleMaps": {
             "apiKey": "YOUR_API_KEY_HERE"
           }
         }
       }
     }
   }
   ```

4. Start the development server:
```bash
npm start
```

5. Run on your preferred platform:
```bash
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web Browser
```

## Usage

### Capturing a Map

1. **Navigate** to your desired location using the map interface
2. **Adjust** the viewport using pinch-to-zoom and drag gestures
3. **Select** aspect ratio and preview theme (optional)
4. **Capture** the location - saves instantly as a project

### Exporting Pixel Art

1. **Open Gallery** to view your captured projects
2. **Tap a project** to open the export screen
3. **Choose settings**:
   - Theme (Game Boy, NES, Sepia, etc.)
   - Resolution (SD to 4K)
   - Pixel size (8px to 128px blocks)
4. **Export** to generate your pixel art map
5. **Share** or save the final image

## Available Themes

- **Game Boy** - Classic green monochrome
- **Game Boy Pocket** - Gray scale variant
- **NES** - 8-bit console colors
- **SNES** - 16-bit vibrant palette
- **Sepia** - Vintage brown tones
- **Blueprint** - Technical drawing style
- **Cyberpunk** - Neon pink and cyan
- **Desert** - Warm sand and earth tones
- **Forest** - Natural green shades
- **Ocean** - Deep blue maritime colors
- **Sunset** - Orange and purple gradient
- **Monochrome** - Pure black and white
- **Pastel** - Soft, muted colors
- **Retro CGA** - Classic PC graphics
- **ZX Spectrum** - British computer colors

## Architecture

The app follows an **infrastructure-first, metadata-driven** architecture:

- **Projects**: Lightweight metadata captures (~50KB) containing location, zoom level, and settings
- **Exports**: High-resolution rendered images (1-10MB) generated on-demand
- **Separation of Concerns**: Instant capture with deferred processing for optimal UX

### Key Technologies

- **Expo SDK 54** with New Architecture enabled
- **React Native 0.76.5** for cross-platform development
- **React Native Skia** for GPU-accelerated image processing
- **React Native Maps** for map display and interaction
- **AsyncStorage** for metadata persistence
- **Expo Image Manipulator** for pixelation effects

## Development

### Project Structure

```
expo_test/
├── App.js                 # Entry point with migration handling
├── AppNavigator.js        # Navigation structure
├── screens/
│   ├── MapScreen.js       # Map capture interface
│   ├── GalleryScreen.js   # Project gallery
│   ├── ExportScreen.js    # Export configuration
│   └── ExportsLibraryScreen.js  # Exported images
├── components/
│   ├── ViewportOverlay.js # Capture frame overlay
│   ├── ThemePicker.js     # Theme selection UI
│   └── SettingsSheet.js   # Settings drawer
├── services/
│   ├── projectStorage.js  # Project CRUD operations
│   ├── exportStorage.js   # Export management
│   └── cacheManager.js    # File system operations
├── utils/
│   ├── imageProcessor.js  # Capture and pixelation
│   └── themeProcessor.js  # Skia shader color mapping
└── constants/
    ├── themes.js          # Theme palettes
    ├── settings.js        # App configuration
    └── schemas.js         # Data schemas
```

### Adding New Themes

1. Define your palette in `constants/themes.js`:
```javascript
export const MY_THEME = {
  name: 'My Theme',
  palette: ['#000000', '#555555', '#AAAAAA', '#FFFFFF'],
  colorCount: 4,
  style: 'retro'  // or 'modern'
};
```

2. The shader system automatically handles the new palette
3. No additional code changes needed!

### Debugging

```bash
# Check storage usage
npm run storage-report

# Clean orphaned files
npm run clean-cache

# View migration status
npm run migration-status
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by classic RPG games like Final Fantasy, Dragon Quest, and Zelda
- Built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/)
- Map data provided by Google Maps
- Pixel art processing powered by React Native Skia

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/rpg-pixel-map-generator/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/rpg-pixel-map-generator/discussions)
- **Email**: support@yourproject.com

## Roadmap

- [ ] Custom color palette editor
- [ ] Tileset export for game engines
- [ ] Batch export functionality
- [ ] Cloud backup and sync
- [ ] Community theme marketplace
- [ ] Advanced filters (weather, time of day)
- [ ] Drawing tools for custom elements

---

Made with love by [Your Name]