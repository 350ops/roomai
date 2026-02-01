// Material and texture presets for Room3DViewer

import * as THREE from 'three';
import type { TexturePreset } from './types';

// Polyfill for document.createElement in React Native (needed for canvas textures)
// This creates a minimal canvas-like interface that Three.js can work with
function createCanvasElement(): HTMLCanvasElement | null {
  // In React Native, we can't create real canvas elements
  // Return null to signal that procedural textures should use fallback colors
  if (typeof document === 'undefined') {
    return null;
  }
  return document.createElement('canvas');
}

// Color palettes for different presets
const PRESET_COLORS = {
  modern: {
    wall: '#F5F5F5',
    wallSecondary: '#E8E8E8',
    floor: '#8B7355', // Warm wood
    floorSecondary: '#A0522D',
    ceiling: '#FFFFFF',
    door: '#4A3728', // Dark wood
    doorFrame: '#5C4033',
    window: '#87CEEB',
    windowFrame: '#2F2F2F',
    furniture: '#6B7280',
  },
  classic: {
    wall: '#FDF5E6', // Old lace
    wallSecondary: '#FAF0E6',
    floor: '#654321', // Dark wood
    floorSecondary: '#8B4513',
    ceiling: '#FFFEF0',
    door: '#3C280D',
    doorFrame: '#4A3728',
    window: '#B0E0E6',
    windowFrame: '#4A3728',
    furniture: '#8B4513',
  },
  minimal: {
    wall: '#FFFFFF',
    wallSecondary: '#F8F8F8',
    floor: '#D3D3D3', // Light gray
    floorSecondary: '#C0C0C0',
    ceiling: '#FFFFFF',
    door: '#333333',
    doorFrame: '#444444',
    window: '#E0F7FA',
    windowFrame: '#333333',
    furniture: '#9E9E9E',
  },
  industrial: {
    wall: '#B0B0B0', // Concrete gray
    wallSecondary: '#A0A0A0',
    floor: '#2F2F2F', // Dark concrete
    floorSecondary: '#3D3D3D',
    ceiling: '#4A4A4A',
    door: '#1A1A1A',
    doorFrame: '#2D2D2D',
    window: '#708090',
    windowFrame: '#1A1A1A',
    furniture: '#4A4A4A',
  },
};

export interface MaterialSet {
  wall: THREE.Material;
  floor: THREE.Material;
  ceiling: THREE.Material;
  door: THREE.Material;
  doorFrame: THREE.Material;
  window: THREE.Material;
  windowFrame: THREE.Material;
  furniture: THREE.Material;
}

/**
 * Create a simple wood-like pattern using procedural approach
 * Returns null in React Native environment (no DOM canvas available)
 */
function createWoodTexture(baseColor: string, grainColor: string): THREE.CanvasTexture | null {
  const canvas = createCanvasElement();
  if (!canvas) {
    // In React Native, we can't create canvas textures
    // The material will use color only
    return null;
  }
  
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  // Base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);
  
  // Wood grain lines
  ctx.strokeStyle = grainColor;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(0, y);
    
    // Wavy line for wood grain
    for (let x = 0; x < 256; x += 10) {
      ctx.lineTo(x, y + Math.sin(x * 0.1) * 3 + (Math.random() - 0.5) * 2);
    }
    ctx.stroke();
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  
  return texture;
}

/**
 * Create a subtle wall texture
 * Returns null in React Native environment (no DOM canvas available)
 */
function createWallTexture(baseColor: string): THREE.CanvasTexture | null {
  const canvas = createCanvasElement();
  if (!canvas) {
    // In React Native, we can't create canvas textures
    return null;
  }
  
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  // Base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 128, 128);
  
  // Subtle noise for texture
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const shade = Math.random() > 0.5 ? '#FFFFFF' : '#000000';
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, 2, 2);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  
  return texture;
}

/**
 * Create materials for a given preset
 */
export function createMaterials(preset: TexturePreset): MaterialSet {
  const colors = PRESET_COLORS[preset];
  
  // Wall material with subtle texture (texture may be null in React Native)
  const wallTexture = createWallTexture(colors.wall);
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture || undefined,
    color: new THREE.Color(colors.wall),
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  
  // Floor material with wood-like texture (texture may be null in React Native)
  const floorTexture = createWoodTexture(colors.floor, colors.floorSecondary);
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture || undefined,
    color: new THREE.Color(colors.floor),
    roughness: 0.7,
    metalness: 0.1,
  });
  
  // Ceiling material - flat white
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.ceiling),
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  
  // Door material
  const doorMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.door),
    roughness: 0.6,
    metalness: 0.1,
  });
  
  // Door frame material
  const doorFrameMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.doorFrame),
    roughness: 0.5,
    metalness: 0.2,
  });
  
  // Window material (glass-like)
  const windowMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colors.window),
    roughness: 0.1,
    metalness: 0,
    transmission: 0.9,
    transparent: true,
    opacity: 0.3,
  });
  
  // Window frame material
  const windowFrameMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.windowFrame),
    roughness: 0.4,
    metalness: 0.3,
  });
  
  // Furniture placeholder material
  const furnitureMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.furniture),
    roughness: 0.7,
    metalness: 0.1,
  });
  
  return {
    wall: wallMaterial,
    floor: floorMaterial,
    ceiling: ceilingMaterial,
    door: doorMaterial,
    doorFrame: doorFrameMaterial,
    window: windowMaterial,
    windowFrame: windowFrameMaterial,
    furniture: furnitureMaterial,
  };
}

/**
 * Dispose of materials to prevent memory leaks
 */
export function disposeMaterials(materials: MaterialSet): void {
  Object.values(materials).forEach((material) => {
    if (material instanceof THREE.Material) {
      material.dispose();
      // Dispose textures if they exist
      if ('map' in material && material.map) {
        (material.map as THREE.Texture).dispose();
      }
    }
  });
}

// Color helpers for furniture categories
export const FURNITURE_COLORS: Record<string, string> = {
  sofa: '#6B8E23', // Olive
  chair: '#8B4513', // Saddle brown
  table: '#A0522D', // Sienna
  bed: '#4682B4', // Steel blue
  storage: '#708090', // Slate gray
  television: '#2F2F2F', // Dark gray
  fireplace: '#8B0000', // Dark red
  bathtub: '#F5F5F5', // White smoke
  toilet: '#F5F5F5',
  sink: '#DCDCDC', // Gainsboro
  refrigerator: '#C0C0C0', // Silver
  stove: '#2F2F2F',
  dishwasher: '#C0C0C0',
  washer: '#F5F5F5',
  dryer: '#F5F5F5',
  unknown: '#9E9E9E',
};

/**
 * Get furniture material by category
 */
export function getFurnitureMaterial(category: string): THREE.MeshStandardMaterial {
  const color = FURNITURE_COLORS[category] || FURNITURE_COLORS.unknown;
  
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.7,
    metalness: 0.1,
  });
}
