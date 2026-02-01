// Types for Room3DViewer

export type Vector3Array = [number, number, number];
export type TransformMatrix = number[];

export interface RoomElement {
  identifier: string;
  dimensions?: Vector3Array;
  transform?: TransformMatrix;
  category?: Record<string, any>;
}

export interface RoomSection {
  label?: string;
  story?: number;
  center?: Vector3Array;
}

export interface RoomPlanData {
  sections?: RoomSection[];
  walls?: RoomElement[];
  doors?: RoomElement[];
  windows?: RoomElement[];
  openings?: RoomElement[];
  floors?: RoomElement[];
  objects?: RoomElement[];
  [key: string]: any;
}

export type TexturePreset = 'modern' | 'classic' | 'minimal' | 'industrial';

export interface Room3DViewerProps {
  roomData: RoomPlanData;
  texturePreset?: TexturePreset;
  showFurniture?: boolean;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export interface ProcessedWall {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: [number, number, number];
}

export interface ProcessedFloor {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: [number, number, number];
}

export interface ProcessedDoor {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: [number, number, number];
}

export interface ProcessedWindow {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: [number, number, number];
}

export interface ProcessedFurniture {
  id: string;
  category: string;
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: [number, number, number];
}

export interface ProcessedRoomData {
  walls: ProcessedWall[];
  floors: ProcessedFloor[];
  doors: ProcessedDoor[];
  windows: ProcessedWindow[];
  furniture: ProcessedFurniture[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
    centerX: number;
    centerY: number;
    centerZ: number;
  };
}
