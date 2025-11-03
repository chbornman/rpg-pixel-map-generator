// Generate dynamic map style based on feature toggles
export const generateMapStyle = (features = {}) => {
  const style = [
    // Always hide all labels and text
    {
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'administrative',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'administrative',
      elementType: 'geometry',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.icon',
      stylers: [{ visibility: 'off' }],
    },
  ];

  // Roads
  if (!features.roads) {
    style.push({
      featureType: 'road',
      stylers: [{ visibility: 'off' }],
    });
  } else {
    style.push({
      featureType: 'road',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    });
  }

  // Buildings
  if (!features.buildings) {
    style.push({
      featureType: 'poi.business',
      stylers: [{ visibility: 'off' }],
    });
    style.push({
      featureType: 'poi.attraction',
      stylers: [{ visibility: 'off' }],
    });
    style.push({
      featureType: 'poi.government',
      stylers: [{ visibility: 'off' }],
    });
    style.push({
      featureType: 'poi.medical',
      stylers: [{ visibility: 'off' }],
    });
    style.push({
      featureType: 'poi.place_of_worship',
      stylers: [{ visibility: 'off' }],
    });
    style.push({
      featureType: 'poi.school',
      stylers: [{ visibility: 'off' }],
    });
    style.push({
      featureType: 'poi.sports_complex',
      stylers: [{ visibility: 'off' }],
    });
  }

  // Water
  if (!features.water) {
    style.push({
      featureType: 'water',
      stylers: [{ visibility: 'off' }],
    });
  } else {
    style.push({
      featureType: 'water',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    });
  }

  // Parks
  if (!features.parks) {
    style.push({
      featureType: 'poi.park',
      stylers: [{ visibility: 'off' }],
    });
    style.push({
      featureType: 'landscape.natural',
      stylers: [{ visibility: 'off' }],
    });
  }

  // Transit
  if (!features.transit) {
    style.push({
      featureType: 'transit',
      stylers: [{ visibility: 'off' }],
    });
  } else {
    style.push({
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    });
  }

  // Landscape (terrain features)
  if (!features.landscape) {
    style.push({
      featureType: 'landscape',
      stylers: [{ visibility: 'off' }],
    });
  }

  return style;
};

// Default style (all features visible, no labels)
export const MAP_STYLE_NO_LABELS = generateMapStyle({
  roads: true,
  buildings: true,
  water: true,
  parks: true,
  transit: false,
  landscape: true,
});
