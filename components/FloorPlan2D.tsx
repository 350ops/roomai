import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Rect,
  Line,
  Path,
  Text as SvgText,
  G,
  Defs,
  LinearGradient,
  Stop,
  Pattern,
  Polygon,
} from 'react-native-svg';
import useThemeColors from '@/app/_contexts/ThemeColors';

// Types
type Vector3Array = [number, number, number];
type TransformMatrix = number[];

interface RoomElement {
  identifier: string;
  dimensions?: Vector3Array;
  transform?: TransformMatrix;
  category?: Record<string, any>;
}

interface RoomSection {
  label?: string;
  story?: number;
  center?: Vector3Array;
}

interface RoomPlanData {
  sections?: RoomSection[];
  walls?: RoomElement[];
  doors?: RoomElement[];
  windows?: RoomElement[];
  openings?: RoomElement[];
  floors?: RoomElement[];
  objects?: RoomElement[];
}

interface FloorPlan2DProps {
  roomData: RoomPlanData;
  width: number;
  height: number;
  showMeasurements?: boolean;
  showFurniture?: boolean;
}

interface Point {
  x: number;
  y: number;
}

// Format measurements
const formatMeasurement = (meters: number): string => {
  if (meters < 1) {
    return `${Math.round(meters * 100)}cm`;
  }
  const m = Math.floor(meters);
  const cm = Math.round((meters - m) * 100);
  if (cm === 0) return `${m}m`;
  return `${m}.${cm.toString().padStart(2, '0')}m`;
};

// Calculate distance between two points
const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
};

// Sort points to form a closed polygon (nearest neighbor algorithm)
const sortPointsForPolygon = (points: Point[]): Point[] => {
  if (points.length <= 2) return points;
  
  const sorted: Point[] = [];
  const remaining = [...points];
  
  // Start with the leftmost point
  remaining.sort((a, b) => a.x - b.x);
  sorted.push(remaining.shift()!);
  
  // Keep finding the nearest unvisited point
  while (remaining.length > 0) {
    const current = sorted[sorted.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const dist = distance(current, remaining[i]);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }
    
    sorted.push(remaining.splice(nearestIdx, 1)[0]);
  }
  
  return sorted;
};

// Simplify polygon by removing collinear points
const simplifyPolygon = (points: Point[], tolerance: number = 5): Point[] => {
  if (points.length <= 3) return points;
  
  const simplified: Point[] = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    // Check if current point is significantly different from the line prev->next
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - prev.x;
    const dy2 = next.y - prev.y;
    
    const cross = Math.abs(dx1 * dy2 - dy1 * dx2);
    const len = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    const dist = cross / (len || 1);
    
    if (dist > tolerance) {
      simplified.push(curr);
    }
  }
  
  simplified.push(points[points.length - 1]);
  return simplified;
};

export default function FloorPlan2D({
  roomData,
  width,
  height,
  showMeasurements = true,
  showFurniture = true,
}: FloorPlan2DProps) {
  const colors = useThemeColors();

  const getPosition = (transform?: TransformMatrix) => {
    if (!transform || transform.length < 15) return null;
    return { x: transform[12], y: transform[13], z: transform[14] };
  };

  const getRotation = (transform?: TransformMatrix) => {
    if (!transform || transform.length < 11) return 0;
    const angle = Math.atan2(transform[8], transform[0]);
    return (angle * 180) / Math.PI;
  };

  const processedData = useMemo(() => {
    const walls = roomData.walls || [];
    const doors = roomData.doors || [];
    const windows = roomData.windows || [];
    const objects = roomData.objects || [];
    const floors = roomData.floors || [];

    // Collect all wall corner points
    const allCorners: { x: number; z: number }[] = [];
    
    walls.forEach((wall) => {
      const pos = getPosition(wall.transform);
      const dims = wall.dimensions || [0, 0, 0];
      const rotation = getRotation(wall.transform);
      const radians = (rotation * Math.PI) / 180;
      
      if (!pos) return;

      const halfLength = dims[0] / 2;
      const dx = Math.cos(radians) * halfLength;
      const dz = Math.sin(radians) * halfLength;
      
      allCorners.push({ x: pos.x - dx, z: pos.z - dz });
      allCorners.push({ x: pos.x + dx, z: pos.z + dz });
    });

    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    allCorners.forEach((corner) => {
      minX = Math.min(minX, corner.x);
      maxX = Math.max(maxX, corner.x);
      minZ = Math.min(minZ, corner.z);
      maxZ = Math.max(maxZ, corner.z);
    });

    // Add padding
    const padding = 1.0;
    minX -= padding;
    maxX += padding;
    minZ -= padding;
    maxZ += padding;

    const roomWidth = maxX - minX;
    const roomDepth = maxZ - minZ;

    // Calculate scale
    const marginX = 55;
    const marginY = 65;
    const scaleX = (width - marginX * 2) / roomWidth;
    const scaleZ = (height - marginY * 2) / roomDepth;
    const scale = Math.min(scaleX, scaleZ);

    const offsetX = (width - roomWidth * scale) / 2;
    const offsetZ = (height - roomDepth * scale) / 2;

    const toScreen = (worldX: number, worldZ: number): Point => ({
      x: (worldX - minX) * scale + offsetX,
      y: (worldZ - minZ) * scale + offsetZ,
    });

    // Convert corners to screen coordinates
    const screenCorners = allCorners.map(c => toScreen(c.x, c.z));
    
    // Sort corners to form a closed polygon
    const sortedCorners = sortPointsForPolygon(screenCorners);
    
    // Simplify to remove redundant points
    const roomOutline = simplifyPolygon(sortedCorners, 8);

    // Process individual walls for segment info
    const wallSegments = walls.map((wall) => {
      const pos = getPosition(wall.transform);
      const dims = wall.dimensions || [0, 0, 0];
      const rotation = getRotation(wall.transform);
      const radians = (rotation * Math.PI) / 180;
      
      if (!pos) return null;

      const halfLength = dims[0] / 2;
      const dx = Math.cos(radians) * halfLength;
      const dz = Math.sin(radians) * halfLength;
      
      const start = toScreen(pos.x - dx, pos.z - dz);
      const end = toScreen(pos.x + dx, pos.z + dz);
      const center = toScreen(pos.x, pos.z);

      return {
        start,
        end,
        center,
        length: dims[0],
        rotation,
      };
    }).filter(Boolean);

    // Process doors
    const processedDoors = doors.map((door) => {
      const pos = getPosition(door.transform);
      const dims = door.dimensions || [0.9, 2.1, 0.1];
      const rotation = getRotation(door.transform);
      
      if (!pos) return null;

      const screenPos = toScreen(pos.x, pos.z);
      const doorWidth = Math.max(dims[0] * scale, 25);

      return {
        x: screenPos.x,
        y: screenPos.y,
        width: doorWidth,
        rotation,
        realWidth: dims[0],
      };
    }).filter(Boolean);

    // Process windows
    const processedWindows = windows.map((window) => {
      const pos = getPosition(window.transform);
      const dims = window.dimensions || [1.2, 1.2, 0.1];
      const rotation = getRotation(window.transform);
      
      if (!pos) return null;

      const screenPos = toScreen(pos.x, pos.z);
      const windowWidth = Math.max(dims[0] * scale, 20);

      return {
        x: screenPos.x,
        y: screenPos.y,
        width: windowWidth,
        rotation,
        realWidth: dims[0],
      };
    }).filter(Boolean);

    // Process furniture
    const processedObjects = objects.map((obj) => {
      const pos = getPosition(obj.transform);
      const dims = obj.dimensions || [0.5, 0.5, 0.5];
      const rotation = getRotation(obj.transform);
      const category = obj.category ? Object.keys(obj.category)[0] : 'unknown';
      
      if (!pos) return null;

      const screenPos = toScreen(pos.x, pos.z);

      return {
        x: screenPos.x,
        y: screenPos.y,
        width: Math.max(dims[0] * scale, 24),
        depth: Math.max((dims[2] || dims[0]) * scale, 24),
        rotation,
        category,
      };
    }).filter(Boolean);

    // Calculate actual room dimensions (from wall extremes)
    const actualWidth = maxX - minX - padding * 2;
    const actualDepth = maxZ - minZ - padding * 2;

    return {
      roomOutline,
      wallSegments,
      doors: processedDoors,
      windows: processedWindows,
      objects: processedObjects,
      roomWidth: actualWidth,
      roomDepth: actualDepth,
      scale,
      offsetX,
      offsetZ,
      bounds: { minX, maxX, minZ, maxZ },
    };
  }, [roomData, width, height]);

  // Theme colors
  const isDark = colors.isDark;
  const bgColor = isDark ? '#1A1A1C' : '#F8F9FA';
  const floorColor = isDark ? '#252528' : '#FFFFFF';
  const wallColor = isDark ? '#D1D1D6' : '#2C3E50';
  const wallFillColor = isDark ? '#3A3A3C' : '#34495E';
  const doorColor = '#27AE60';
  const windowColor = '#3498DB';
  const furnitureColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(44,62,80,0.08)';
  const furnitureStroke = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(44,62,80,0.2)';
  const textColor = isDark ? '#8E8E93' : '#7F8C8D';
  const accentColor = isDark ? '#0A84FF' : '#3498DB';
  const gridColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';

  // Create room outline path
  const outlinePath = processedData.roomOutline.length > 2
    ? `M ${processedData.roomOutline.map(p => `${p.x},${p.y}`).join(' L ')} Z`
    : '';

  // Wall thickness for outline
  const wallThickness = 8;

  // Render furniture with proper icons
  const renderFurniture = (obj: any, index: number) => {
    const { x, y, width: w, depth: d, rotation, category } = obj;
    
    const baseProps = {
      fill: furnitureColor,
      stroke: furnitureStroke,
      strokeWidth: 1,
    };

    switch (category.toLowerCase()) {
      case 'sofa':
        return (
          <G key={`f-${index}`} rotation={rotation} origin={`${x}, ${y}`}>
            <Rect x={x - w/2} y={y - d/2} width={w} height={d} rx={4} {...baseProps} />
            <Rect x={x - w/2 + 3} y={y - d/2 + 3} width={w - 6} height={d * 0.35} rx={2} 
              fill={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(44,62,80,0.05)'} />
            <Rect x={x - w/2 + 3} y={y - d/2 + 3} width={w * 0.15} height={d - 6} rx={2}
              fill={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(44,62,80,0.04)'} />
            <Rect x={x + w/2 - w * 0.15 - 3} y={y - d/2 + 3} width={w * 0.15} height={d - 6} rx={2}
              fill={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(44,62,80,0.04)'} />
          </G>
        );
      case 'bed':
        return (
          <G key={`f-${index}`} rotation={rotation} origin={`${x}, ${y}`}>
            <Rect x={x - w/2} y={y - d/2} width={w} height={d} rx={3} {...baseProps} />
            <Rect x={x - w/2 + 4} y={y - d/2 + 4} width={w/2 - 6} height={d * 0.2} rx={2}
              fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(44,62,80,0.08)'} stroke="none" />
            <Rect x={x + 2} y={y - d/2 + 4} width={w/2 - 6} height={d * 0.2} rx={2}
              fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(44,62,80,0.08)'} stroke="none" />
            <Line x1={x - w/2 + 4} y1={y + d/2 - 4} x2={x + w/2 - 4} y2={y + d/2 - 4}
              stroke={furnitureStroke} strokeWidth={1} />
          </G>
        );
      case 'table':
        return (
          <G key={`f-${index}`} rotation={rotation} origin={`${x}, ${y}`}>
            <Rect x={x - w/2} y={y - d/2} width={w} height={d} rx={2}
              fill="none" stroke={furnitureStroke} strokeWidth={1.5} />
            <Line x1={x - w/2 + 4} y1={y - d/2 + 4} x2={x + w/2 - 4} y2={y + d/2 - 4}
              stroke={furnitureStroke} strokeWidth={0.5} opacity={0.5} />
            <Line x1={x + w/2 - 4} y1={y - d/2 + 4} x2={x - w/2 + 4} y2={y + d/2 - 4}
              stroke={furnitureStroke} strokeWidth={0.5} opacity={0.5} />
          </G>
        );
      case 'chair':
        return (
          <G key={`f-${index}`} rotation={rotation} origin={`${x}, ${y}`}>
            <Rect x={x - w/2} y={y - d/2} width={w} height={d} rx={3} {...baseProps} />
            <Rect x={x - w/2 + 2} y={y - d/2 + 2} width={w - 4} height={d * 0.3} rx={1}
              fill={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(44,62,80,0.06)'} stroke="none" />
          </G>
        );
      case 'storage':
        return (
          <G key={`f-${index}`} rotation={rotation} origin={`${x}, ${y}`}>
            <Rect x={x - w/2} y={y - d/2} width={w} height={d} rx={2} {...baseProps} />
            <Line x1={x - w/2} y1={y} x2={x + w/2} y2={y} stroke={furnitureStroke} strokeWidth={0.5} />
            <Line x1={x} y1={y - d/2} x2={x} y2={y + d/2} stroke={furnitureStroke} strokeWidth={0.5} />
          </G>
        );
      default:
        return (
          <G key={`f-${index}`} rotation={rotation} origin={`${x}, ${y}`}>
            <Rect x={x - w/2} y={y - d/2} width={w} height={d} rx={3} {...baseProps} strokeDasharray="4,2" />
          </G>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Svg width={width} height={height}>
        <Defs>
          {/* Floor grid pattern */}
          <Pattern id="floorGrid" width={24} height={24} patternUnits="userSpaceOnUse">
            <Rect width={24} height={24} fill={floorColor} />
            <Path d="M 24 0 L 0 0 0 24" fill="none" stroke={gridColor} strokeWidth={1} />
          </Pattern>
          
          {/* Wall gradient for 3D effect */}
          <LinearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={wallColor} />
            <Stop offset="100%" stopColor={wallFillColor} />
          </LinearGradient>
        </Defs>

        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill={bgColor} />

        {/* Room floor (inside walls) */}
        {outlinePath && (
          <Path
            d={outlinePath}
            fill="url(#floorGrid)"
            stroke="none"
          />
        )}

        {/* Room walls - outer stroke for thickness effect */}
        {outlinePath && (
          <>
            {/* Wall shadow */}
            <Path
              d={outlinePath}
              fill="none"
              stroke={isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'}
              strokeWidth={wallThickness + 4}
              strokeLinejoin="round"
              transform="translate(2, 2)"
            />
            {/* Main wall */}
            <Path
              d={outlinePath}
              fill="none"
              stroke="url(#wallGrad)"
              strokeWidth={wallThickness}
              strokeLinejoin="round"
            />
            {/* Inner highlight */}
            <Path
              d={outlinePath}
              fill="none"
              stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)'}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </>
        )}

        {/* Doors */}
        {processedData.doors.map((door: any, index) => (
          <G key={`door-${index}`} rotation={door.rotation} origin={`${door.x}, ${door.y}`}>
            {/* Door opening (gap in wall) */}
            <Rect
              x={door.x - door.width / 2 - 2}
              y={door.y - wallThickness / 2 - 2}
              width={door.width + 4}
              height={wallThickness + 4}
              fill={floorColor}
            />
            {/* Door threshold */}
            <Rect
              x={door.x - door.width / 2}
              y={door.y - 1}
              width={door.width}
              height={2}
              fill={doorColor}
              opacity={0.3}
            />
            {/* Door frame left */}
            <Rect
              x={door.x - door.width / 2 - 2}
              y={door.y - wallThickness / 2}
              width={3}
              height={wallThickness}
              fill={doorColor}
              rx={1}
            />
            {/* Door frame right */}
            <Rect
              x={door.x + door.width / 2 - 1}
              y={door.y - wallThickness / 2}
              width={3}
              height={wallThickness}
              fill={doorColor}
              rx={1}
            />
            {/* Door swing arc */}
            <Path
              d={`M ${door.x - door.width / 2} ${door.y + wallThickness / 2 + 2}
                  A ${door.width * 0.85} ${door.width * 0.85} 0 0 0 
                  ${door.x - door.width / 2 + door.width * 0.6} ${door.y + wallThickness / 2 + door.width * 0.65}`}
              stroke={doorColor}
              strokeWidth={1.5}
              fill="none"
              opacity={0.7}
            />
            {/* Door panel */}
            <Line
              x1={door.x - door.width / 2}
              y1={door.y + wallThickness / 2 + 2}
              x2={door.x - door.width / 2 + door.width * 0.6}
              y2={door.y + wallThickness / 2 + door.width * 0.65}
              stroke={doorColor}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </G>
        ))}

        {/* Windows */}
        {processedData.windows.map((window: any, index) => (
          <G key={`window-${index}`} rotation={window.rotation} origin={`${window.x}, ${window.y}`}>
            {/* Window opening */}
            <Rect
              x={window.x - window.width / 2 - 1}
              y={window.y - wallThickness / 2 - 1}
              width={window.width + 2}
              height={wallThickness + 2}
              fill={floorColor}
            />
            {/* Window sill */}
            <Rect
              x={window.x - window.width / 2}
              y={window.y - 2}
              width={window.width}
              height={4}
              fill={isDark ? 'rgba(52,152,219,0.2)' : 'rgba(52,152,219,0.15)'}
              rx={1}
            />
            {/* Window frame */}
            <Rect
              x={window.x - window.width / 2}
              y={window.y - 2}
              width={window.width}
              height={4}
              fill="none"
              stroke={windowColor}
              strokeWidth={1.5}
              rx={1}
            />
            {/* Window pane divider */}
            <Line
              x1={window.x}
              y1={window.y - 2}
              x2={window.x}
              y2={window.y + 2}
              stroke={windowColor}
              strokeWidth={1}
            />
            {/* Glass effect lines */}
            <Line
              x1={window.x - window.width / 4}
              y1={window.y - 1}
              x2={window.x - window.width / 4}
              y2={window.y + 1}
              stroke={windowColor}
              strokeWidth={0.5}
              opacity={0.5}
            />
            <Line
              x1={window.x + window.width / 4}
              y1={window.y - 1}
              x2={window.x + window.width / 4}
              y2={window.y + 1}
              stroke={windowColor}
              strokeWidth={0.5}
              opacity={0.5}
            />
          </G>
        ))}

        {/* Furniture */}
        {showFurniture && processedData.objects.map((obj: any, index) => renderFurniture(obj, index))}

        {/* Dimension lines */}
        {showMeasurements && (
          <G>
            {/* Width dimension (bottom) */}
            <G>
              <Line
                x1={processedData.offsetX}
                y1={height - 32}
                x2={processedData.offsetX + processedData.roomWidth * processedData.scale}
                y2={height - 32}
                stroke={accentColor}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Line x1={processedData.offsetX} y1={height - 38} x2={processedData.offsetX} y2={height - 26}
                stroke={accentColor} strokeWidth={1.5} strokeLinecap="round" />
              <Line x1={processedData.offsetX + processedData.roomWidth * processedData.scale} y1={height - 38}
                x2={processedData.offsetX + processedData.roomWidth * processedData.scale} y2={height - 26}
                stroke={accentColor} strokeWidth={1.5} strokeLinecap="round" />
              {/* Arrows */}
              <Path d={`M ${processedData.offsetX} ${height - 32} l 6 -3 l 0 6 z`} fill={accentColor} />
              <Path d={`M ${processedData.offsetX + processedData.roomWidth * processedData.scale} ${height - 32} l -6 -3 l 0 6 z`} fill={accentColor} />
              {/* Label */}
              <Rect x={width / 2 - 28} y={height - 22} width={56} height={20} rx={4} fill={bgColor} />
              <SvgText x={width / 2} y={height - 8} fontSize={12} fill={accentColor} textAnchor="middle" fontWeight="700">
                {formatMeasurement(processedData.roomWidth)}
              </SvgText>
            </G>

            {/* Depth dimension (right) */}
            <G>
              <Line
                x1={width - 32}
                y1={processedData.offsetZ}
                x2={width - 32}
                y2={processedData.offsetZ + processedData.roomDepth * processedData.scale}
                stroke={accentColor}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              <Line x1={width - 38} y1={processedData.offsetZ} x2={width - 26} y2={processedData.offsetZ}
                stroke={accentColor} strokeWidth={1.5} strokeLinecap="round" />
              <Line x1={width - 38} y1={processedData.offsetZ + processedData.roomDepth * processedData.scale}
                x2={width - 26} y2={processedData.offsetZ + processedData.roomDepth * processedData.scale}
                stroke={accentColor} strokeWidth={1.5} strokeLinecap="round" />
              {/* Arrows */}
              <Path d={`M ${width - 32} ${processedData.offsetZ} l -3 6 l 6 0 z`} fill={accentColor} />
              <Path d={`M ${width - 32} ${processedData.offsetZ + processedData.roomDepth * processedData.scale} l -3 -6 l 6 0 z`} fill={accentColor} />
              {/* Label */}
              <G rotation={-90} origin={`${width - 12}, ${height / 2}`}>
                <Rect x={width - 40} y={height / 2 - 10} width={56} height={20} rx={4} fill={bgColor} />
                <SvgText x={width - 12} y={height / 2 + 4} fontSize={12} fill={accentColor} textAnchor="middle" fontWeight="700">
                  {formatMeasurement(processedData.roomDepth)}
                </SvgText>
              </G>
            </G>
          </G>
        )}

        {/* Legend */}
        <G>
          <Rect x={10} y={10} width={115} height={28} rx={8} fill={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)'} />
          {/* Door */}
          <Rect x={18} y={20} width={12} height={8} rx={1} fill={doorColor} opacity={0.8} />
          <SvgText x={35} y={27} fontSize={10} fill={textColor} fontWeight="500">Door</SvgText>
          {/* Window */}
          <Rect x={68} y={20} width={14} height={6} rx={1} fill="none" stroke={windowColor} strokeWidth={1.5} />
          <SvgText x={88} y={27} fontSize={10} fill={textColor} fontWeight="500">Win</SvgText>
        </G>

        {/* Scale bar */}
        <G>
          <Rect x={10} y={height - 38} width={75} height={26} rx={8} fill={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)'} />
          <Line x1={18} y1={height - 22} x2={18 + processedData.scale} y2={height - 22}
            stroke={textColor} strokeWidth={2} strokeLinecap="round" />
          <Line x1={18} y1={height - 27} x2={18} y2={height - 17} stroke={textColor} strokeWidth={1.5} />
          <Line x1={18 + processedData.scale} y1={height - 27} x2={18 + processedData.scale} y2={height - 17}
            stroke={textColor} strokeWidth={1.5} />
          <SvgText x={18 + processedData.scale + 8} y={height - 18} fontSize={11} fill={textColor} fontWeight="600">
            1m
          </SvgText>
        </G>

        {/* Precision badge */}
        <G>
          <Rect x={width - 70} y={10} width={60} height={22} rx={6} fill={accentColor} opacity={0.15} />
          <SvgText x={width - 40} y={25} fontSize={10} fill={accentColor} textAnchor="middle" fontWeight="600">
            ± 1-2cm
          </SvgText>
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
});
