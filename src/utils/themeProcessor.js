import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Skia, TileMode, FilterMode, MipmapMode } from '@shopify/react-native-skia';

// Convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [0, 0, 0];
};

// Create shader for contrast and saturation adjustments
const createAdjustmentShader = (contrast, saturation) => {
  const shaderSource = `
uniform shader image;
uniform float contrast;
uniform float saturation;

vec3 adjustContrastSaturation(vec3 color) {
  // Apply contrast
  vec3 adjusted = (color - 0.5) * contrast + 0.5;

  // Apply saturation
  float gray = dot(adjusted, vec3(0.299, 0.587, 0.114));
  adjusted = mix(vec3(gray), adjusted, saturation);

  // Clamp to valid range
  return clamp(adjusted, 0.0, 1.0);
}

vec4 main(vec2 coord) {
  vec4 color = image.eval(coord);
  vec3 adjusted = adjustContrastSaturation(color.rgb);
  return vec4(adjusted, color.a);
}
`;

  return Skia.RuntimeEffect.Make(shaderSource);
};

// Create shader for edge detection
const createEdgeDetectionShader = (strength, imageWidth, imageHeight) => {
  const shaderSource = `
uniform shader image;
uniform float strength;
uniform vec2 imageSize;

vec4 main(vec2 coord) {
  vec2 pixelSize = 1.0 / imageSize;

  // Sample neighboring pixels (Sobel operator)
  vec3 tl = image.eval(coord + vec2(-pixelSize.x, -pixelSize.y)).rgb;
  vec3 t  = image.eval(coord + vec2(0.0, -pixelSize.y)).rgb;
  vec3 tr = image.eval(coord + vec2(pixelSize.x, -pixelSize.y)).rgb;
  vec3 l  = image.eval(coord + vec2(-pixelSize.x, 0.0)).rgb;
  vec3 c  = image.eval(coord).rgb;
  vec3 r  = image.eval(coord + vec2(pixelSize.x, 0.0)).rgb;
  vec3 bl = image.eval(coord + vec2(-pixelSize.x, pixelSize.y)).rgb;
  vec3 b  = image.eval(coord + vec2(0.0, pixelSize.y)).rgb;
  vec3 br = image.eval(coord + vec2(pixelSize.x, pixelSize.y)).rgb;

  // Sobel horizontal and vertical gradients
  vec3 gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
  vec3 gy = -tl - 2.0*t - tr + bl + 2.0*b + br;

  // Edge magnitude
  float edge = length(gx) + length(gy);
  edge = clamp(edge * strength, 0.0, 1.0);

  // Blend edges with original (darken edges)
  vec3 result = c * (1.0 - edge);

  return vec4(result, 1.0);
}
`;

  return Skia.RuntimeEffect.Make(shaderSource);
};

// Create GLSL shader for posterization with dithering
const createPosterizeShader = (levels, ditherIntensity) => {
  const shaderSource = `
uniform shader image;
uniform float levels;
uniform float ditherIntensity;

// Bayer matrix 4x4 for ordered dithering (flattened)
float getBayerValue(vec2 coord) {
  float x = mod(coord.x, 4.0);
  float y = mod(coord.y, 4.0);

  // Manually unroll the 4x4 Bayer matrix
  float value = 0.0;

  if (y < 1.0) {
    if (x < 1.0) value = 0.0/16.0;
    else if (x < 2.0) value = 8.0/16.0;
    else if (x < 3.0) value = 2.0/16.0;
    else value = 10.0/16.0;
  } else if (y < 2.0) {
    if (x < 1.0) value = 12.0/16.0;
    else if (x < 2.0) value = 4.0/16.0;
    else if (x < 3.0) value = 14.0/16.0;
    else value = 6.0/16.0;
  } else if (y < 3.0) {
    if (x < 1.0) value = 3.0/16.0;
    else if (x < 2.0) value = 11.0/16.0;
    else if (x < 3.0) value = 1.0/16.0;
    else value = 9.0/16.0;
  } else {
    if (x < 1.0) value = 15.0/16.0;
    else if (x < 2.0) value = 7.0/16.0;
    else if (x < 3.0) value = 13.0/16.0;
    else value = 5.0/16.0;
  }

  return value;
}

vec4 main(vec2 coord) {
  vec4 color = image.eval(coord);

  // Apply dithering
  float dither = 0.0;
  if (ditherIntensity > 0.0) {
    dither = (getBayerValue(coord) - 0.5) * ditherIntensity;
  }

  // Quantize each channel with dither
  vec3 quantized;
  quantized.r = floor((color.r + dither) * levels + 0.5) / levels;
  quantized.g = floor((color.g + dither) * levels + 0.5) / levels;
  quantized.b = floor((color.b + dither) * levels + 0.5) / levels;

  // Clamp
  quantized = clamp(quantized, 0.0, 1.0);

  return vec4(quantized, color.a);
}
`;

  return Skia.RuntimeEffect.Make(shaderSource);
};

// Extract unique colors from posterized image
const extractPosterizedColors = (imageData, width, height, maxColors = 16) => {
  const colorSet = new Set();

  // Sample pixels to find unique colors
  // Image data is RGBA, 4 bytes per pixel
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];

    // Create color key
    const colorKey = `${r},${g},${b}`;
    colorSet.add(colorKey);

    if (colorSet.size >= maxColors) break;
  }

  // Convert to RGB array
  return Array.from(colorSet).map(key => {
    const [r, g, b] = key.split(',').map(Number);
    return [r / 255, g / 255, b / 255];
  });
};

// Create GLSL shader for mapping posterized colors to theme palette
const createColorMappingShader = (colorMapping) => {
  // colorMapping is array of [sourceColor, targetColor] pairs
  const mappingDeclarations = colorMapping
    .map((mapping, i) => {
      const [src, tgt] = mapping;
      return `  vec3 src${i} = vec3(${src.join(', ')});
  vec3 tgt${i} = vec3(${tgt.join(', ')});`;
    })
    .join('\n');

  const shaderSource = `
uniform shader image;

vec3 mapColor(vec3 color) {
${mappingDeclarations}

  float minDist = 10000.0;
  vec3 mapped = color;

  ${colorMapping.map((_, i) => `
  {
    float dist = distance(color, src${i});
    if (dist < minDist) {
      minDist = dist;
      mapped = tgt${i};
    }
  }`).join('')}

  return mapped;
}

vec4 main(vec2 coord) {
  vec4 color = image.eval(coord);
  vec3 mappedColor = mapColor(color.rgb);
  return vec4(mappedColor, color.a);
}
`;

  return Skia.RuntimeEffect.Make(shaderSource);
};

// Apply theme with all effects
export const applyTheme = async (
  imageUri,
  theme,
  basePixelationSize,
  options = {}
) => {
  const {
    ditherIntensity = 0,
    edgeDetection = 'none',
    contrast = 1.0,
    saturation = 1.0,
  } = options;
  try {
    console.log(`Applying ${theme.name} with effects:`, {
      dither: ditherIntensity,
      edge: edgeDetection,
      contrast,
      saturation,
    });

    // Load the image
    const imageData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    let image = Skia.Image.MakeImageFromEncoded(
      Skia.Data.fromBase64(imageData)
    );

    if (!image) {
      throw new Error('Failed to load image');
    }

    const width = image.width();
    const height = image.height();

    // STEP 1: Apply contrast and saturation adjustments
    if (contrast !== 1.0 || saturation !== 1.0) {
      console.log('Step 1: Applying contrast/saturation adjustments...');
      const adjustmentEffect = createAdjustmentShader(contrast, saturation);
      if (!adjustmentEffect) {
        throw new Error('Failed to create adjustment shader');
      }

      const imageShader = image.makeShaderOptions(
        TileMode.Clamp,
        TileMode.Clamp,
        FilterMode.Nearest,
        MipmapMode.None
      );

      const adjustmentShader = adjustmentEffect.makeShaderWithChildren(
        [contrast, saturation],
        [imageShader]
      );

      const adjustmentSurface = Skia.Surface.MakeOffscreen(width, height);
      if (!adjustmentSurface) {
        throw new Error('Failed to create adjustment surface');
      }

      const adjustmentCanvas = adjustmentSurface.getCanvas();
      const adjustmentPaint = Skia.Paint();
      adjustmentPaint.setShader(adjustmentShader);
      adjustmentCanvas.drawRect({ x: 0, y: 0, width, height }, adjustmentPaint);
      adjustmentSurface.flush();

      image = adjustmentSurface.makeImageSnapshot();
      if (!image) {
        throw new Error('Failed to create adjusted snapshot');
      }
    }

    // STEP 2: Apply edge detection
    if (edgeDetection !== 'none') {
      console.log(`Step 2: Applying ${edgeDetection} edge detection...`);
      const edgeStrengthMap = {
        soft: 0.3,
        strong: 0.8,
        selective: 0.5,
      };
      const edgeStrength = edgeStrengthMap[edgeDetection] || 0;

      const edgeEffect = createEdgeDetectionShader(edgeStrength, width, height);
      if (!edgeEffect) {
        throw new Error('Failed to create edge detection shader');
      }

      const imageShader = image.makeShaderOptions(
        TileMode.Clamp,
        TileMode.Clamp,
        FilterMode.Nearest,
        MipmapMode.None
      );

      const edgeShader = edgeEffect.makeShaderWithChildren(
        [edgeStrength, width, height],
        [imageShader]
      );

      const edgeSurface = Skia.Surface.MakeOffscreen(width, height);
      if (!edgeSurface) {
        throw new Error('Failed to create edge surface');
      }

      const edgeCanvas = edgeSurface.getCanvas();
      const edgePaint = Skia.Paint();
      edgePaint.setShader(edgeShader);
      edgeCanvas.drawRect({ x: 0, y: 0, width, height }, edgePaint);
      edgeSurface.flush();

      image = edgeSurface.makeImageSnapshot();
      if (!image) {
        throw new Error('Failed to create edge snapshot');
      }
    }

    // STEP 3: Posterize the image with dithering
    console.log('Step 3: Posterizing image with dithering...');
    const posterizeLevels = 4; // This gives us ~64 colors max (4^3)
    const posterizeEffect = createPosterizeShader(posterizeLevels, ditherIntensity);
    if (!posterizeEffect) {
      throw new Error('Failed to create posterize shader');
    }

    const imageShader = image.makeShaderOptions(
      TileMode.Clamp,
      TileMode.Clamp,
      FilterMode.Nearest,
      MipmapMode.None
    );

    const posterizeShader = posterizeEffect.makeShaderWithChildren(
      [posterizeLevels, ditherIntensity],
      [imageShader]
    );

    // Render posterized image
    const posterizeSurface = Skia.Surface.MakeOffscreen(width, height);
    if (!posterizeSurface) {
      throw new Error('Failed to create posterize surface');
    }

    const posterizeCanvas = posterizeSurface.getCanvas();
    const posterizePaint = Skia.Paint();
    posterizePaint.setShader(posterizeShader);
    posterizeCanvas.drawRect({ x: 0, y: 0, width, height }, posterizePaint);
    posterizeSurface.flush();

    const posterizedImage = posterizeSurface.makeImageSnapshot();
    if (!posterizedImage) {
      throw new Error('Failed to create posterized snapshot');
    }

    // STEP 4: Extract posterized colors
    console.log('Step 4: Extracting posterized colors...');
    const pixels = posterizedImage.readPixels();
    if (!pixels) {
      throw new Error('Failed to read pixels from posterized image');
    }

    const posterizedColors = extractPosterizedColors(pixels, width, height, 16);
    console.log(`Found ${posterizedColors.length} unique posterized colors`);

    // STEP 5: Map each posterized color to closest theme color
    console.log('Step 5: Mapping posterized colors to theme palette...');
    const themeRgb = theme.palette.map(hexToRgb);
    const colorMapping = posterizedColors.map(posterColor => {
      // Find closest theme color
      let minDist = Infinity;
      let closestThemeColor = themeRgb[0];

      for (const themeColor of themeRgb) {
        const dist = Math.sqrt(
          Math.pow(posterColor[0] - themeColor[0], 2) +
          Math.pow(posterColor[1] - themeColor[1], 2) +
          Math.pow(posterColor[2] - themeColor[2], 2)
        );

        if (dist < minDist) {
          minDist = dist;
          closestThemeColor = themeColor;
        }
      }

      return [posterColor, closestThemeColor];
    });

    console.log('Color mapping created:', colorMapping.length, 'mappings');

    // STEP 6: Apply color mapping
    console.log('Step 6: Applying color mapping to theme palette...');
    const mappingEffect = createColorMappingShader(colorMapping);
    if (!mappingEffect) {
      throw new Error('Failed to create mapping shader');
    }

    const posterizedShader = posterizedImage.makeShaderOptions(
      TileMode.Clamp,
      TileMode.Clamp,
      FilterMode.Nearest,
      MipmapMode.None
    );

    const mappingShader = mappingEffect.makeShaderWithChildren(
      [],
      [posterizedShader]
    );

    // Render final themed image
    const finalSurface = Skia.Surface.MakeOffscreen(width, height);
    if (!finalSurface) {
      throw new Error('Failed to create final surface');
    }

    const finalCanvas = finalSurface.getCanvas();
    const finalPaint = Skia.Paint();
    finalPaint.setShader(mappingShader);
    finalCanvas.drawRect({ x: 0, y: 0, width, height }, finalPaint);
    finalSurface.flush();

    const finalSnapshot = finalSurface.makeImageSnapshot();
    if (!finalSnapshot) {
      throw new Error('Failed to create final snapshot');
    }

    // Encode to base64
    const base64 = finalSnapshot.encodeToBase64();
    if (!base64) {
      throw new Error('Failed to encode image');
    }

    // Save to file
    const tempPath = FileSystem.cacheDirectory + `themed_${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(tempPath, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log(`Theme ${theme.name} applied successfully`);
    return tempPath;
  } catch (error) {
    console.error('Error applying theme:', error);
    throw error;
  }
};

// Basic pixelation (for initial capture)
export const pixelateImage = async (imageUri, pixelationSize, outputSize, aspectRatio = 1) => {
  try {
    console.log(`Pixelating: pixelationSize=${pixelationSize}, outputSize=${outputSize}, aspectRatio=${aspectRatio}`);

    // Validate inputs
    if (!pixelationSize || pixelationSize <= 0) {
      throw new Error(`Invalid pixelationSize: ${pixelationSize}`);
    }
    if (!outputSize || outputSize <= 0) {
      throw new Error(`Invalid outputSize: ${outputSize}`);
    }
    if (!aspectRatio || aspectRatio <= 0) {
      throw new Error(`Invalid aspectRatio: ${aspectRatio}`);
    }

    // First, get the original image dimensions
    const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {});
    const { width: originalWidth, height: originalHeight } = imageInfo;

    console.log(`Original dimensions: ${originalWidth}x${originalHeight}`);

    // Calculate crop dimensions to match the aspect ratio (center-cropped)
    let cropWidth, cropHeight, originX, originY;

    if (originalWidth / originalHeight > aspectRatio) {
      // Image is wider than target aspect ratio - crop width
      cropHeight = originalHeight;
      cropWidth = originalHeight * aspectRatio;
      originX = Math.floor((originalWidth - cropWidth) / 2);
      originY = 0;
    } else {
      // Image is taller than target aspect ratio - crop height
      cropWidth = originalWidth;
      cropHeight = originalWidth / aspectRatio;
      originX = 0;
      originY = Math.floor((originalHeight - cropHeight) / 2);
    }

    console.log(`Crop: ${Math.floor(cropWidth)}x${Math.floor(cropHeight)} at (${originX}, ${originY})`);

    // Validate crop dimensions
    if (cropWidth <= 0 || cropHeight <= 0) {
      throw new Error(`Invalid crop dimensions: ${cropWidth}x${cropHeight}`);
    }

    // Apply crop and pixelation in one operation
    const pixelated = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { crop: {
          originX: Math.floor(originX),
          originY: Math.floor(originY),
          width: Math.floor(cropWidth),
          height: Math.floor(cropHeight)
        } },
        { resize: { width: Math.floor(pixelationSize) } },
        { resize: { width: Math.floor(outputSize) } },
      ],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );

    console.log(`Pixelation complete: ${pixelated.uri}`);
    return pixelated.uri;
  } catch (error) {
    console.error('Error pixelating image:', error);
    throw error;
  }
};
