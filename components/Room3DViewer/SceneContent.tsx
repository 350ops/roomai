// 3D Scene content for Room3DViewer

import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { ProcessedRoomData, TexturePreset } from './types';
import { createMaterials, disposeMaterials, getFurnitureMaterial, type MaterialSet } from './materials';
import { calculateCameraPosition } from './transforms';

interface SceneContentProps {
  processedData: ProcessedRoomData;
  texturePreset: TexturePreset;
  showFurniture: boolean;
}

// Wall mesh component
function WallMesh({ 
  position, 
  rotation, 
  dimensions, 
  material 
}: { 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  dimensions: [number, number, number]; 
  material: THREE.Material;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  }, [rotation]);
  
  // Wall geometry: width (x), height (y), depth/thickness (z)
  return (
    <mesh 
      ref={meshRef}
      position={[position[0], position[1] + dimensions[1] / 2, position[2]]}
      material={material}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[dimensions[0], dimensions[1], dimensions[2] || 0.15]} />
    </mesh>
  );
}

// Floor mesh component
function FloorMesh({ 
  position, 
  rotation, 
  dimensions, 
  material 
}: { 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  dimensions: [number, number, number]; 
  material: THREE.Material;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.set(-Math.PI / 2, 0, rotation[1]);
    }
  }, [rotation]);
  
  // Floor is horizontal - use width and depth
  const floorWidth = dimensions[0];
  const floorDepth = dimensions[2] || dimensions[1];
  
  return (
    <mesh 
      ref={meshRef}
      position={[position[0], position[1], position[2]]}
      material={material}
      receiveShadow
    >
      <planeGeometry args={[floorWidth, floorDepth]} />
    </mesh>
  );
}

// Ceiling component - generated from floor bounds
function CeilingMesh({ 
  bounds, 
  material 
}: { 
  bounds: ProcessedRoomData['bounds']; 
  material: THREE.Material;
}) {
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  
  return (
    <mesh 
      position={[bounds.centerX, bounds.maxY, bounds.centerZ]}
      rotation={[-Math.PI / 2, 0, 0]}
      material={material}
    >
      <planeGeometry args={[width + 0.1, depth + 0.1]} />
    </mesh>
  );
}

// Door mesh component
function DoorMesh({ 
  position, 
  rotation, 
  dimensions, 
  doorMaterial,
  frameMaterial,
}: { 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  dimensions: [number, number, number]; 
  doorMaterial: THREE.Material;
  frameMaterial: THREE.Material;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  }, [rotation]);
  
  const doorWidth = dimensions[0] || 0.9;
  const doorHeight = dimensions[1] || 2.1;
  const frameThickness = 0.05;
  
  return (
    <group 
      ref={groupRef}
      position={[position[0], position[1] + doorHeight / 2, position[2]]}
    >
      {/* Door panel */}
      <mesh material={doorMaterial} castShadow>
        <boxGeometry args={[doorWidth - frameThickness * 2, doorHeight - frameThickness * 2, 0.04]} />
      </mesh>
      
      {/* Door frame - left */}
      <mesh 
        position={[-doorWidth / 2 + frameThickness / 2, 0, 0]}
        material={frameMaterial}
      >
        <boxGeometry args={[frameThickness, doorHeight, 0.08]} />
      </mesh>
      
      {/* Door frame - right */}
      <mesh 
        position={[doorWidth / 2 - frameThickness / 2, 0, 0]}
        material={frameMaterial}
      >
        <boxGeometry args={[frameThickness, doorHeight, 0.08]} />
      </mesh>
      
      {/* Door frame - top */}
      <mesh 
        position={[0, doorHeight / 2 - frameThickness / 2, 0]}
        material={frameMaterial}
      >
        <boxGeometry args={[doorWidth, frameThickness, 0.08]} />
      </mesh>
    </group>
  );
}

// Window mesh component
function WindowMesh({ 
  position, 
  rotation, 
  dimensions, 
  windowMaterial,
  frameMaterial,
}: { 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  dimensions: [number, number, number]; 
  windowMaterial: THREE.Material;
  frameMaterial: THREE.Material;
}) {
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  }, [rotation]);
  
  const windowWidth = dimensions[0] || 1.2;
  const windowHeight = dimensions[1] || 1.2;
  const frameWidth = 0.04;
  
  return (
    <group 
      ref={groupRef}
      position={[position[0], position[1] + windowHeight / 2, position[2]]}
    >
      {/* Glass pane */}
      <mesh material={windowMaterial}>
        <boxGeometry args={[windowWidth - frameWidth * 2, windowHeight - frameWidth * 2, 0.02]} />
      </mesh>
      
      {/* Window frame - all four sides */}
      {/* Left */}
      <mesh 
        position={[-windowWidth / 2 + frameWidth / 2, 0, 0]}
        material={frameMaterial}
      >
        <boxGeometry args={[frameWidth, windowHeight, 0.05]} />
      </mesh>
      
      {/* Right */}
      <mesh 
        position={[windowWidth / 2 - frameWidth / 2, 0, 0]}
        material={frameMaterial}
      >
        <boxGeometry args={[frameWidth, windowHeight, 0.05]} />
      </mesh>
      
      {/* Top */}
      <mesh 
        position={[0, windowHeight / 2 - frameWidth / 2, 0]}
        material={frameMaterial}
      >
        <boxGeometry args={[windowWidth, frameWidth, 0.05]} />
      </mesh>
      
      {/* Bottom */}
      <mesh 
        position={[0, -windowHeight / 2 + frameWidth / 2, 0]}
        material={frameMaterial}
      >
        <boxGeometry args={[windowWidth, frameWidth, 0.05]} />
      </mesh>
      
      {/* Center divider - vertical */}
      <mesh material={frameMaterial}>
        <boxGeometry args={[frameWidth / 2, windowHeight - frameWidth * 2, 0.03]} />
      </mesh>
      
      {/* Center divider - horizontal */}
      <mesh material={frameMaterial}>
        <boxGeometry args={[windowWidth - frameWidth * 2, frameWidth / 2, 0.03]} />
      </mesh>
    </group>
  );
}

// Furniture placeholder mesh
function FurnitureMesh({ 
  position, 
  rotation, 
  dimensions, 
  category,
}: { 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  dimensions: [number, number, number]; 
  category: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => getFurnitureMaterial(category), [category]);
  
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  }, [rotation]);
  
  // Position furniture at floor level (y = 0 + half height)
  const furnitureHeight = dimensions[1] || 0.5;
  
  return (
    <mesh 
      ref={meshRef}
      position={[position[0], position[1] + furnitureHeight / 2, position[2]]}
      material={material}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[dimensions[0], furnitureHeight, dimensions[2] || dimensions[0]]} />
    </mesh>
  );
}

// Lighting setup
function Lighting() {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.4} color="#ffffff" />
      
      {/* Main directional light (sun-like) */}
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Fill light from opposite direction */}
      <directionalLight 
        position={[-3, 5, -3]} 
        intensity={0.3}
        color="#f0f5ff"
      />
      
      {/* Hemisphere light for sky/ground color */}
      <hemisphereLight 
        args={['#87CEEB', '#F5F5DC', 0.3]}
      />
    </>
  );
}

// Camera controller
function CameraController({ bounds }: { bounds: ProcessedRoomData['bounds'] }) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  useEffect(() => {
    const cameraPos = calculateCameraPosition(bounds);
    camera.position.set(cameraPos[0], cameraPos[1], cameraPos[2]);
    camera.lookAt(bounds.centerX, bounds.centerY, bounds.centerZ);
  }, [bounds, camera]);
  
  return (
    <OrbitControls
      ref={controlsRef}
      target={[bounds.centerX, bounds.centerY, bounds.centerZ]}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={1}
      maxDistance={20}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2 + 0.1}
    />
  );
}

export default function SceneContent({ 
  processedData, 
  texturePreset, 
  showFurniture 
}: SceneContentProps) {
  // Create materials based on preset
  const materials = useMemo(() => createMaterials(texturePreset), [texturePreset]);
  
  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      disposeMaterials(materials);
    };
  }, [materials]);
  
  return (
    <>
      {/* Camera and controls */}
      <CameraController bounds={processedData.bounds} />
      
      {/* Lighting */}
      <Lighting />
      
      {/* Walls */}
      {processedData.walls.map((wall) => (
        <WallMesh
          key={wall.id}
          position={wall.position}
          rotation={wall.rotation}
          dimensions={wall.dimensions}
          material={materials.wall}
        />
      ))}
      
      {/* Floors */}
      {processedData.floors.map((floor) => (
        <FloorMesh
          key={floor.id}
          position={floor.position}
          rotation={floor.rotation}
          dimensions={floor.dimensions}
          material={materials.floor}
        />
      ))}
      
      {/* Ceiling */}
      <CeilingMesh bounds={processedData.bounds} material={materials.ceiling} />
      
      {/* Doors */}
      {processedData.doors.map((door) => (
        <DoorMesh
          key={door.id}
          position={door.position}
          rotation={door.rotation}
          dimensions={door.dimensions}
          doorMaterial={materials.door}
          frameMaterial={materials.doorFrame}
        />
      ))}
      
      {/* Windows */}
      {processedData.windows.map((window) => (
        <WindowMesh
          key={window.id}
          position={window.position}
          rotation={window.rotation}
          dimensions={window.dimensions}
          windowMaterial={materials.window}
          frameMaterial={materials.windowFrame}
        />
      ))}
      
      {/* Furniture */}
      {showFurniture && processedData.furniture.map((item) => (
        <FurnitureMesh
          key={item.id}
          position={item.position}
          rotation={item.rotation}
          dimensions={item.dimensions}
          category={item.category}
        />
      ))}
    </>
  );
}
