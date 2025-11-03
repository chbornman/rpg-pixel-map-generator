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

// Create GLSL shader for color palette mapping
const createPaletteShader = (palette) => {
  // Convert palette to vec3 array for shader
  const paletteVec3 = palette.map(hexToRgb);
  const paletteSize = palette.length;

  // Build shader uniforms string
  const paletteDeclaration = paletteVec3
    .map((color, i) => `  vec3 palette${i} = vec3(${color.join(', ')});`)
    .join('\n');

  // GLSL shader source
  const shaderSource = `
uniform shader image;

vec3 findClosestColor(vec3 color) {
${paletteDeclaration}

  float minDist = 10000.0;
  vec3 closest = palette0;

  ${paletteVec3
    .map(
      (_, i) => `
  {
    float dist = distance(color, palette${i});
    if (dist < minDist) {
      minDist = dist;
      closest = palette${i};
    }
  }`
    )
    .join('')}

  return closest;
}

vec4 main(vec2 coord) {
  vec4 color = image.eval(coord);
  vec3 mappedColor = findClosestColor(color.rgb);
  return vec4(mappedColor, color.a);
}
`;

  return Skia.RuntimeEffect.Make(shaderSource);
};

// Apply theme with color palette mapping using Skia
export const applyTheme = async (imageUri, theme, basePixelationSize) => {
  try {
    console.log(`Applying ${theme.name} with ${theme.palette.length} colors`);

    // Load the image
    const imageData = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const image = Skia.Image.MakeImageFromEncoded(
      Skia.Data.fromBase64(imageData)
    );

    if (!image) {
      throw new Error('Failed to load image');
    }

    const width = image.width();
    const height = image.height();

    // Create runtime shader for palette mapping
    const runtimeEffect = createPaletteShader(theme.palette);
    if (!runtimeEffect) {
      throw new Error('Failed to create shader');
    }

    const imageShader = image.makeShaderOptions(
      TileMode.Clamp,
      TileMode.Clamp,
      FilterMode.Nearest,
      MipmapMode.None
    );
    const shader = runtimeEffect.makeShaderWithChildren([], [imageShader]);

    // Create offscreen surface for rendering
    const surface = Skia.Surface.MakeOffscreen(width, height);
    if (!surface) {
      throw new Error('Failed to create surface');
    }

    const canvas = surface.getCanvas();

    // Draw with palette shader
    const paint = Skia.Paint();
    paint.setShader(shader);

    canvas.drawRect({ x: 0, y: 0, width, height }, paint);
    surface.flush();

    // Get the image
    const snapshot = surface.makeImageSnapshot();
    if (!snapshot) {
      throw new Error('Failed to create snapshot');
    }

    // Encode to base64
    const base64 = snapshot.encodeToBase64();
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
    // First, get the original image dimensions
    const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {});
    const { width: originalWidth, height: originalHeight } = imageInfo;

    // Calculate crop dimensions to match the aspect ratio (center-cropped)
    let cropWidth, cropHeight, originX, originY;

    if (originalWidth / originalHeight > aspectRatio) {
      // Image is wider than target aspect ratio - crop width
      cropHeight = originalHeight;
      cropWidth = originalHeight * aspectRatio;
      originX = (originalWidth - cropWidth) / 2;
      originY = 0;
    } else {
      // Image is taller than target aspect ratio - crop height
      cropWidth = originalWidth;
      cropHeight = originalWidth / aspectRatio;
      originX = 0;
      originY = (originalHeight - cropHeight) / 2;
    }

    // Apply crop and pixelation in one operation
    const pixelated = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { crop: { originX, originY, width: cropWidth, height: cropHeight } },
        { resize: { width: pixelationSize } },
        { resize: { width: outputSize } },
      ],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );

    return pixelated.uri;
  } catch (error) {
    console.error('Error pixelating image:', error);
    throw error;
  }
};
