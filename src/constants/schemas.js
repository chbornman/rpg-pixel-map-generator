/**
 * Data schema definitions for the RPG Pixel Map Generator
 * Version 1 - Projects and Exports architecture
 */

export const SCHEMA_VERSION = 1;

// Storage keys
export const STORAGE_KEYS = {
  PROJECTS: '@rpg_maps_projects_v1',
  EXPORTS: '@rpg_maps_exports_v1',
  SCHEMA_VERSION: '@rpg_maps_schema_version',
  LEGACY_MAPS: '@rpg_maps', // Old storage key for migration
};

// Directory paths
export const DIRECTORIES = {
  PROJECTS: 'rpg_maps/projects/',
  EXPORTS: 'rpg_maps/exports/',
  THUMBNAILS: 'rpg_maps/thumbnails/',
  CACHE: 'rpg_maps/cache/',
};

/**
 * Project Schema - Captured map metadata (lightweight, editable)
 */
export const createProject = ({
  region,
  location,
  settings,
  previewTheme = null,
  thumbnail,
  notes = null,
}) => {
  const now = new Date().toISOString();
  const id = Date.now().toString();

  return {
    id,
    type: 'project',
    version: SCHEMA_VERSION,

    // Map state (allows exact recreation)
    region: {
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    },

    // Location metadata
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name || 'Unknown Location',
      address: location.address || null,
    },

    // Capture settings (viewport configuration and map features)
    settings: {
      aspectRatio: settings.aspectRatio,
      mapFeatures: settings.mapFeatures || {
        roads: true,
        buildings: true,
        water: true,
        parks: true,
        transit: false,
        landscape: true,
      },
    },

    // Preview state
    previewTheme,
    thumbnail,

    // Metadata
    timestamp: now,
    lastModified: now,
    notes,
  };
};

/**
 * Export Schema - Rendered high-res output
 */
export const createExport = ({
  projectId,
  theme,
  resolution,
  pixelationSize,
  ditherIntensity,
  edgeDetection,
  contrast,
  saturation,
  imagePath,
  fileSize,
  exportDuration,
}) => {
  const now = new Date().toISOString();
  const id = `${projectId}_${Date.now()}`;

  return {
    id,
    type: 'export',
    version: SCHEMA_VERSION,

    projectId,

    // Render settings used
    theme,
    resolution: {
      width: resolution.width,
      height: resolution.height,
    },
    pixelationSize,
    ditherIntensity,
    edgeDetection,
    contrast,
    saturation,

    // Output
    imagePath,
    fileSize,

    // Metadata
    timestamp: now,
    exportDuration,
  };
};

/**
 * Validates a project object
 */
export const isValidProject = (project) => {
  return (
    project &&
    project.type === 'project' &&
    project.id &&
    project.region &&
    project.location &&
    project.settings &&
    project.thumbnail &&
    project.timestamp
  );
};

/**
 * Validates an export object
 */
export const isValidExport = (exportData) => {
  return (
    exportData &&
    exportData.type === 'export' &&
    exportData.id &&
    exportData.projectId &&
    exportData.theme &&
    exportData.imagePath &&
    exportData.timestamp
  );
};
