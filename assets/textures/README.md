# Texture Assets

This directory contains textures for the Room3DViewer material system.

## Directory Structure

```
textures/
  walls/
    paint-white.jpg
    paint-beige.jpg
    paint-gray.jpg
    concrete.jpg
  floors/
    hardwood.jpg
    hardwood-dark.jpg
    tile-white.jpg
    tile-gray.jpg
    carpet.jpg
  windows/
    glass.jpg
```

## Texture Requirements

### Walls
- **Resolution**: 512x512 or 1024x1024
- **Type**: Seamless tileable
- **Content**: Subtle paint/plaster texture
- **Format**: JPG (quality 80-90%)

### Floors
- **Resolution**: 1024x1024 (for wood grain detail)
- **Type**: Seamless tileable
- **Content**: Wood planks, tiles, or carpet patterns
- **Format**: JPG (quality 85-95%)

### Windows
- **Resolution**: 256x256 or 512x512
- **Type**: Subtle glass texture with light reflection
- **Format**: PNG (with alpha for transparency) or JPG

## Texture Sources

### Free Textures
- [Polyhaven](https://polyhaven.com/textures) - CC0 high-quality textures
- [Textures.com](https://www.textures.com) - Free tier available
- [ambientCG](https://ambientcg.com) - CC0 PBR textures
- [FreePBR](https://freepbr.com) - Free PBR materials

### Creating Seamless Textures

In Photoshop or GIMP:
1. Filter > Other > Offset (by half width/height)
2. Fix visible seams with clone stamp
3. Check with Filter > Pattern > Make Seamless

## Optimization

For React Native / Expo GL performance:
- Use JPG for opaque textures (smaller file size)
- Use PNG only when alpha channel is needed
- Compress with tools like TinyPNG or ImageOptim
- Consider power-of-2 dimensions for GPU efficiency

## Current Implementation

The Room3DViewer currently generates procedural textures in code (see `materials.ts`). Adding actual texture files will improve visual quality significantly.

To use custom textures:
1. Add texture files to appropriate subdirectory
2. Update `materials.ts` to load textures using Three.js TextureLoader
3. Apply loaded textures to materials instead of procedural ones
