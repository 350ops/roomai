// Furniture model loader hook for loading GLB models

import { useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import type { ProcessedFurniture } from './types';

// Map RoomPlan categories to model paths
// These will be placeholder paths until actual models are added
export const FURNITURE_MODEL_PATHS: Record<string, string> = {
  sofa: 'furniture/sofa.glb',
  chair: 'furniture/chair.glb',
  table: 'furniture/table.glb',
  bed: 'furniture/bed.glb',
  storage: 'furniture/cabinet.glb',
  television: 'furniture/tv.glb',
  fireplace: 'furniture/fireplace.glb',
  bathtub: 'furniture/bathtub.glb',
  toilet: 'furniture/toilet.glb',
  sink: 'furniture/sink.glb',
  refrigerator: 'furniture/refrigerator.glb',
  stove: 'furniture/stove.glb',
  dishwasher: 'furniture/dishwasher.glb',
  washer: 'furniture/washer.glb',
  dryer: 'furniture/dryer.glb',
};

// Model metadata for scaling
export interface ModelMetadata {
  // Original bounding box dimensions (in meters)
  originalWidth: number;
  originalHeight: number;
  originalDepth: number;
  // Pivot offset from center-bottom
  pivotOffset: [number, number, number];
}

// Default metadata for placeholder boxes
const DEFAULT_METADATA: ModelMetadata = {
  originalWidth: 1,
  originalHeight: 1,
  originalDepth: 1,
  pivotOffset: [0, 0, 0],
};

/**
 * Calculate scale factors to match RoomPlan dimensions
 */
export function calculateScaleFactors(
  targetDimensions: [number, number, number],
  metadata: ModelMetadata
): [number, number, number] {
  return [
    targetDimensions[0] / metadata.originalWidth,
    targetDimensions[1] / metadata.originalHeight,
    (targetDimensions[2] || targetDimensions[0]) / metadata.originalDepth,
  ];
}

/**
 * Normalize a loaded GLB model's bounding box
 */
export function normalizeModel(model: THREE.Object3D): ModelMetadata {
  const bbox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  
  bbox.getSize(size);
  bbox.getCenter(center);
  
  // Calculate offset to move pivot to center-bottom
  const pivotOffset: [number, number, number] = [
    -center.x,
    -bbox.min.y, // Move to floor level
    -center.z,
  ];
  
  return {
    originalWidth: size.x,
    originalHeight: size.y,
    originalDepth: size.z,
    pivotOffset,
  };
}

/**
 * Clone a model and apply transforms
 */
export function cloneAndTransformModel(
  sourceModel: THREE.Object3D,
  metadata: ModelMetadata,
  targetDimensions: [number, number, number],
  targetPosition: [number, number, number],
  targetRotation: [number, number, number]
): THREE.Object3D {
  const clone = sourceModel.clone(true);
  
  // Apply pivot offset
  clone.position.set(
    metadata.pivotOffset[0],
    metadata.pivotOffset[1],
    metadata.pivotOffset[2]
  );
  
  // Create a container group for final positioning
  const container = new THREE.Group();
  container.add(clone);
  
  // Calculate and apply scale
  const scale = calculateScaleFactors(targetDimensions, metadata);
  container.scale.set(scale[0], scale[1], scale[2]);
  
  // Apply position and rotation
  container.position.set(targetPosition[0], targetPosition[1], targetPosition[2]);
  container.rotation.set(targetRotation[0], targetRotation[1], targetRotation[2]);
  
  return container;
}

/**
 * Furniture category colors for placeholder boxes
 */
export const FURNITURE_COLORS: Record<string, string> = {
  sofa: '#6B8E23',
  chair: '#8B4513',
  table: '#A0522D',
  bed: '#4682B4',
  storage: '#708090',
  television: '#2F2F2F',
  fireplace: '#8B0000',
  bathtub: '#F5F5F5',
  toilet: '#F5F5F5',
  sink: '#DCDCDC',
  refrigerator: '#C0C0C0',
  stove: '#2F2F2F',
  dishwasher: '#C0C0C0',
  washer: '#F5F5F5',
  dryer: '#F5F5F5',
  unknown: '#9E9E9E',
};

/**
 * Create a placeholder box for furniture when model isn't available
 */
export function createPlaceholderFurniture(
  category: string,
  dimensions: [number, number, number],
  position: [number, number, number],
  rotation: [number, number, number]
): THREE.Mesh {
  const color = FURNITURE_COLORS[category] || FURNITURE_COLORS.unknown;
  
  const geometry = new THREE.BoxGeometry(
    dimensions[0],
    dimensions[1],
    dimensions[2] || dimensions[0]
  );
  
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.7,
    metalness: 0.1,
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  
  // Position at floor level (y = 0 means bottom of box at y = 0)
  mesh.position.set(
    position[0],
    position[1] + dimensions[1] / 2,
    position[2]
  );
  
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  return mesh;
}

/**
 * Hook to manage furniture model loading
 * Returns placeholder boxes for now, can be extended to load GLB models
 */
export function useFurnitureModels(furniture: ProcessedFurniture[]): {
  isLoading: boolean;
  models: Map<string, { mesh: THREE.Object3D; metadata: ModelMetadata }>;
  error: Error | null;
} {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // For now, we use placeholder boxes
  // This can be extended to load actual GLB models
  const models = useMemo(() => {
    const modelMap = new Map<string, { mesh: THREE.Object3D; metadata: ModelMetadata }>();
    
    furniture.forEach((item) => {
      const placeholder = createPlaceholderFurniture(
        item.category,
        item.dimensions,
        item.position,
        item.rotation
      );
      
      modelMap.set(item.id, {
        mesh: placeholder,
        metadata: {
          originalWidth: item.dimensions[0],
          originalHeight: item.dimensions[1],
          originalDepth: item.dimensions[2] || item.dimensions[0],
          pivotOffset: [0, 0, 0],
        },
      });
    });
    
    return modelMap;
  }, [furniture]);
  
  useEffect(() => {
    // Simulate async loading
    setIsLoading(false);
  }, [furniture]);
  
  return { isLoading, models, error };
}

/**
 * Load a GLB model from a URL or local path
 * This is the actual loader for when models are available
 */
export async function loadGLBModel(url: string): Promise<{
  model: THREE.Object3D;
  metadata: ModelMetadata;
}> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        const metadata = normalizeModel(model);
        
        // Enable shadows on all meshes
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        resolve({ model, metadata });
      },
      undefined,
      (error) => {
        reject(new Error(`Failed to load model: ${url} - ${error.message}`));
      }
    );
  });
}

/**
 * Preload all furniture models for a category list
 */
export async function preloadFurnitureModels(
  categories: string[],
  basePath: string = '/assets/models/'
): Promise<Map<string, { model: THREE.Object3D; metadata: ModelMetadata }>> {
  const modelCache = new Map<string, { model: THREE.Object3D; metadata: ModelMetadata }>();
  
  const uniqueCategories = [...new Set(categories)];
  
  await Promise.all(
    uniqueCategories.map(async (category) => {
      const modelPath = FURNITURE_MODEL_PATHS[category];
      if (modelPath) {
        try {
          const { model, metadata } = await loadGLBModel(`${basePath}${modelPath}`);
          modelCache.set(category, { model, metadata });
        } catch (error) {
          console.warn(`Could not load model for category: ${category}`, error);
          // Will fall back to placeholder
        }
      }
    })
  );
  
  return modelCache;
}
