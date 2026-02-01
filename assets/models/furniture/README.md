# Furniture 3D Models

This directory contains low-poly 3D models for furniture replacement in the Room3DViewer.

## Required Models

Place GLB files for the following RoomPlan categories:

| Category      | Filename        | Recommended Triangles |
|---------------|-----------------|----------------------|
| sofa          | sofa.glb        | 2000-4000           |
| chair         | chair.glb       | 1000-2000           |
| table         | table.glb       | 1000-2000           |
| bed           | bed.glb         | 2000-4000           |
| storage       | cabinet.glb     | 1500-3000           |
| television    | tv.glb          | 500-1000            |
| fireplace     | fireplace.glb   | 1500-3000           |
| bathtub       | bathtub.glb     | 2000-3000           |
| toilet        | toilet.glb      | 1000-2000           |
| sink          | sink.glb        | 1000-2000           |
| refrigerator  | refrigerator.glb| 500-1500            |
| stove         | stove.glb       | 1000-2000           |
| dishwasher    | dishwasher.glb  | 500-1000            |
| washer        | washer.glb      | 500-1500            |
| dryer         | dryer.glb       | 500-1500            |

## Model Requirements

1. **Format**: GLB (binary glTF)
2. **Units**: Meters (1 unit = 1 meter)
3. **Origin**: Center-bottom (object sits on floor at Y=0)
4. **Orientation**: Front facing +Z axis
5. **Scale**: Realistic dimensions (e.g., sofa ~2m wide, chair ~0.5m wide)

## Recommended Sources

### Free Models
- [Poly.pizza](https://poly.pizza) - Free low-poly models
- [Sketchfab](https://sketchfab.com/features/free-3d-models) - Free section
- [Quaternius](https://quaternius.com) - CC0 game assets
- [Kenney Assets](https://kenney.nl/assets) - CC0 game assets

### Paid/Premium
- [TurboSquid](https://www.turbosquid.com)
- [CGTrader](https://www.cgtrader.com)

## Converting to GLB

If you have other formats (FBX, OBJ, USDZ):

1. Use [Blender](https://www.blender.org) (free)
2. Import the model
3. Ensure origin is at center-bottom
4. Export as glTF Binary (.glb)

### Blender Quick Steps:
```
1. File > Import > [your format]
2. Select object
3. Object > Set Origin > Origin to Geometry
4. Move object so bottom touches Z=0
5. File > Export > glTF 2.0 (.glb/.gltf)
6. Choose "glTF Binary (.glb)"
```

## Optimization Tips

- Remove invisible faces
- Reduce polygon count where possible
- Bake high-poly details to normal maps
- Use power-of-2 textures (512x512, 1024x1024)
- Compress textures with KTX2 for best performance

## Fallback Behavior

If a model file is missing, the Room3DViewer will display a colored placeholder box matching the furniture's detected dimensions and category color.
