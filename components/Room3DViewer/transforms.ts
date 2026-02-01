// Transform utilities for converting RoomPlan data to Three.js

import * as THREE from 'three';
import type { TransformMatrix, RoomElement, RoomPlanData, ProcessedRoomData, ProcessedWall, ProcessedFloor, ProcessedDoor, ProcessedWindow, ProcessedFurniture } from './types';

/**
 * Extract position from RoomPlan 4x4 transform matrix
 * The position is stored in the last column (indices 12, 13, 14)
 */
export function getPositionFromTransform(transform?: TransformMatrix): [number, number, number] | null {
  if (!transform || transform.length < 15) return null;
  return [transform[12], transform[13], transform[14]];
}

/**
 * Extract Euler rotation from RoomPlan transform matrix
 * RoomPlan uses a 4x4 column-major transform matrix
 */
export function getRotationFromTransform(transform?: TransformMatrix): [number, number, number] {
  if (!transform || transform.length < 11) return [0, 0, 0];
  
  // Create a Three.js matrix from the transform array
  const matrix = new THREE.Matrix4();
  matrix.fromArray(transform);
  
  // Extract Euler angles
  const euler = new THREE.Euler();
  euler.setFromRotationMatrix(matrix, 'YXZ');
  
  return [euler.x, euler.y, euler.z];
}

/**
 * Get quaternion from transform matrix for more accurate rotation
 */
export function getQuaternionFromTransform(transform?: TransformMatrix): THREE.Quaternion {
  if (!transform || transform.length < 16) return new THREE.Quaternion();
  
  const matrix = new THREE.Matrix4();
  matrix.fromArray(transform);
  
  const quaternion = new THREE.Quaternion();
  quaternion.setFromRotationMatrix(matrix);
  
  return quaternion;
}

/**
 * Apply RoomPlan transform to a Three.js object
 */
export function applyRoomPlanTransform(
  object: THREE.Object3D,
  transform: TransformMatrix | undefined,
  dimensions: [number, number, number] | undefined
): void {
  const position = getPositionFromTransform(transform);
  if (position) {
    object.position.set(position[0], position[1], position[2]);
  }
  
  const quaternion = getQuaternionFromTransform(transform);
  object.quaternion.copy(quaternion);
  
  if (dimensions) {
    object.scale.set(dimensions[0], dimensions[1], dimensions[2]);
  }
}

/**
 * Process raw RoomPlan data into structured format for 3D rendering
 */
export function processRoomPlanData(roomData: RoomPlanData): ProcessedRoomData {
  const walls: ProcessedWall[] = [];
  const floors: ProcessedFloor[] = [];
  const doors: ProcessedDoor[] = [];
  const windows: ProcessedWindow[] = [];
  const furniture: ProcessedFurniture[] = [];
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  
  // Process walls
  (roomData.walls || []).forEach((wall, index) => {
    const position = getPositionFromTransform(wall.transform);
    const rotation = getRotationFromTransform(wall.transform);
    const dimensions = wall.dimensions || [1, 2.5, 0.15];
    
    if (position) {
      walls.push({
        id: wall.identifier || `wall-${index}`,
        position: position,
        rotation: rotation,
        dimensions: dimensions as [number, number, number],
      });
      
      // Update bounds
      minX = Math.min(minX, position[0] - dimensions[0] / 2);
      maxX = Math.max(maxX, position[0] + dimensions[0] / 2);
      minY = Math.min(minY, position[1]);
      maxY = Math.max(maxY, position[1] + dimensions[1]);
      minZ = Math.min(minZ, position[2] - dimensions[2] / 2);
      maxZ = Math.max(maxZ, position[2] + dimensions[2] / 2);
    }
  });
  
  // Process floors
  (roomData.floors || []).forEach((floor, index) => {
    const position = getPositionFromTransform(floor.transform);
    const rotation = getRotationFromTransform(floor.transform);
    const dimensions = floor.dimensions || [4, 0.02, 4];
    
    if (position) {
      floors.push({
        id: floor.identifier || `floor-${index}`,
        position: position,
        rotation: rotation,
        dimensions: dimensions as [number, number, number],
      });
    }
  });
  
  // Process doors
  (roomData.doors || []).forEach((door, index) => {
    const position = getPositionFromTransform(door.transform);
    const rotation = getRotationFromTransform(door.transform);
    const dimensions = door.dimensions || [0.9, 2.1, 0.1];
    
    if (position) {
      doors.push({
        id: door.identifier || `door-${index}`,
        position: position,
        rotation: rotation,
        dimensions: dimensions as [number, number, number],
      });
    }
  });
  
  // Process windows
  (roomData.windows || []).forEach((window, index) => {
    const position = getPositionFromTransform(window.transform);
    const rotation = getRotationFromTransform(window.transform);
    const dimensions = window.dimensions || [1.2, 1.2, 0.1];
    
    if (position) {
      windows.push({
        id: window.identifier || `window-${index}`,
        position: position,
        rotation: rotation,
        dimensions: dimensions as [number, number, number],
      });
    }
  });
  
  // Process furniture/objects
  (roomData.objects || []).forEach((obj, index) => {
    const position = getPositionFromTransform(obj.transform);
    const rotation = getRotationFromTransform(obj.transform);
    const dimensions = obj.dimensions || [0.5, 0.5, 0.5];
    const category = obj.category ? Object.keys(obj.category)[0] : 'unknown';
    
    if (position) {
      furniture.push({
        id: obj.identifier || `furniture-${index}`,
        category: category,
        position: position,
        rotation: rotation,
        dimensions: dimensions as [number, number, number],
      });
    }
  });
  
  // Handle edge case where no bounds were set
  if (minX === Infinity) minX = -2;
  if (maxX === -Infinity) maxX = 2;
  if (minY === Infinity) minY = 0;
  if (maxY === -Infinity) maxY = 2.5;
  if (minZ === Infinity) minZ = -2;
  if (maxZ === -Infinity) maxZ = 2;
  
  return {
    walls,
    floors,
    doors,
    windows,
    furniture,
    bounds: {
      minX,
      maxX,
      minY,
      maxY,
      minZ,
      maxZ,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      centerZ: (minZ + maxZ) / 2,
    },
  };
}

/**
 * Calculate optimal camera position based on room bounds
 */
export function calculateCameraPosition(bounds: ProcessedRoomData['bounds']): [number, number, number] {
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const height = bounds.maxY - bounds.minY;
  
  // Position camera to see the entire room
  const maxDimension = Math.max(width, depth, height);
  const distance = maxDimension * 1.5;
  
  return [
    bounds.centerX + distance * 0.7,
    bounds.centerY + distance * 0.5,
    bounds.centerZ + distance * 0.7,
  ];
}
