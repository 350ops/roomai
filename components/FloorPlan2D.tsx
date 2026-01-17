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

// Cross product for convex hull
const cross = (o: Point, a: Point, b: Point): number => {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
};

// Convex Hull using Andrew's monotone chain algorithm
const convexHull = (points: Point[]): Point[] => {
  if (points.length < 3) return points;

  // Sort points by x, then by y
  const sorted = [...points].sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

  // Build lower hull
  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  // Build upper hull
  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Remove last point of each half because it's repeated
  lower.pop();
  upper.pop();

  return [...lower, ...upper];
};

// Smooth corners by adding intermediate points
const smoothPolygon = (points: Point[], cornerRadius: number): string => {
  if (points.length < 3) return '';

  const path: string[] = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    // Calculate vectors
    const v1 = { x: prev.x - curr.x, y: prev.y - curr.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    // Normalize vectors
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (len1 === 0 || len2 === 0) continue;

    const n1 = { x: v1.x / len1, y: v1.y / len1 };
    const n2 = { x: v2.x / len2, y: v2.y / len2 };

    // Calculate corner points
    const radius = Math.min(cornerRadius, len1 / 2, len2 / 2);
    const p1 = { x: curr.x + n1.x * radius, y: curr.y + n1.y * radius };
    const p2 = { x: curr.x + n2.x * radius, y: curr.y + n2.y * radius };

    if (i === 0) {
      path.push(`M ${p1.x} ${p1.y}`);
    } else {
      path.push(`L ${p1.x} ${p1.y}`);
    }

    // Add quadratic curve for corner
    path.push(`Q ${curr.x} ${curr.y} ${p2.x} ${p2.y}`);
  }

  path.push('Z');
  return path.join(' ');
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
      
      // Add both endpoints of the wall
      allCorners.push({ x: pos.x - dx, z: pos.z - dz });
      allCorners.push({ x: pos.x + dx, z: pos.z + dz });
    });

    if (allCorners.length === 0) {
      return null;
    }

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
    const padding = 0.5;
    const paddedMinX = minX - padding;
    const paddedMaxX = maxX + padding;
    const paddedMinZ = minZ - padding;
    const paddedMaxZ = maxZ + padding;

    const totalWidth = paddedMaxX - paddedMinX;
    const totalDepth = paddedMaxZ - paddedMinZ;

    // Calculate scale
    const marginX = 50;
    const marginY = 55;
    const scaleX = (width - marginX * 2) / totalWidth;
    const scaleZ = (height - marginY * 2) / totalDepth;
    const scale = Math.min(scaleX, scaleZ);

    const offsetX = (width - totalWidth * scale) / 2;
    const offsetZ = (height - totalDepth * scale) / 2;

    const toScreen = (worldX: number, worldZ: number): Point => ({
      x: (worldX - paddedMinX) * scale + offsetX,
      y: (worldZ - paddedMinZ) * scale + offsetZ,
    });

    // Convert corners to screen coordinates
    const screenCorners = allCorners.map(c => toScreen(c.x, c.z));
    
    // Use convex hull to get proper room outline
    const roomOutline = convexHull(screenCorners);

    // Process doors
    const processedDoors = doors.map((door) => {
      const pos = getPosition(door.transform);
      const dims = door.dimensions || [0.9, 2.1, 0.1];
      const rotation = getRotation(door.transform);
      
      if (!pos) return null;

      const screenPos = toScreen(pos.x, pos.z);
      const doorWidth = Math.max(dims[0] * scale, 20);

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
      const windowWidth = Math.max(dims[0] * scale, 16);

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
        width: Math.max(dims[0] * scale, 20),
        depth: Math.max((dims[2] || dims[0]) * scale, 20),
        rotation,
        category,
      };
    }).filter(Boolean);

    // Calculate actual room dimensions
    const actualWidth = maxX - minX;
    const actualDepth = maxZ - minZ;

    return {
      roomOutline,
      doors: processedDoors,
      windows: processedWindows,
      objects: processedObjects,
      roomWidth: actualWidth,
      roomDepth: actualDepth,
      scale,
      offsetX,
      offsetZ,
      screenWidth: totalWidth * scale,
      screenDepth: totalDepth * scale,
    };
  }, [roomData, width, height]);

  if (!processedData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.isDark ? '#1A1A1C' : '#F8F9FA' }]}>
        <Svg width={width} height={height}>
          <SvgText x={width / 2} y={height / 2} fontSize={14} fill={colors.placeholder} textAnchor="middle">
            No room data available
          </SvgText>
        </Svg>
      </View>
    );
  }

  // Theme colors
  const isDark = colors.isDark;
  const bgColor = isDark ? '#1A1A1C' : '#F5F7FA';
  const floorColor = isDark ? '#2A2A2E' : '#FFFFFF';
  const wallColor = isDark ? '#E0E0E5' : '#3D5A80';
  const wallStroke = isDark ? '#4A4A4E' : '#2D4A6F';
  const doorColor = '#2ECC71';
  const windowColor = '#3498DB';
  const furnitureColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(61,90,128,0.08)';
  const furnitureStroke = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(61,90,128,0.15)';
  const textColor = isDark ? '#8E8E93' : '#6B7C8F';
  const accentColor = isDark ? '#0A84FF' : '#3498DB';
  const gridColor = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';

  // Create smooth room path
  const roomPath = smoothPolygon(processedData.roomOutline, 8);
  const wallThickness = 10;

  // Render furniture
  const renderFurniture = (obj: any, index: number) => {
    const { x, y, width: w, depth: d, rotation, category } = obj;
    
    return (
      <G key={`f-${index}`} rotation={rotation} origin={`${x}, ${y}`}>
        <Rect
          x={x - w / 2}
          y={y - d / 2}
          width={w}
          height={d}
          rx={3}
          fill={furnitureColor}
          stroke={furnitureStroke}
          strokeWidth={1}
        />
        {category === 'sofa' && (
          <Rect
            x={x - w / 2 + 2}
            y={y - d / 2 + 2}
            width={w - 4}
            height={d * 0.3}
            rx={2}
            fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(61,90,128,0.04)'}
          />
        )}
        {category === 'table' && (
          <>
            <Line x1={x - w / 3} y1={y - d / 3} x2={x + w / 3} y2={y + d / 3} stroke={furnitureStroke} strokeWidth={0.5} />
            <Line x1={x + w / 3} y1={y - d / 3} x2={x - w / 3} y2={y + d / 3} stroke={furnitureStroke} strokeWidth={0.5} />
          </>
        )}
      </G>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Svg width={width} height={height}>
        <Defs>
          {/* Floor grid pattern */}
          <Pattern id="floorGrid" width={20} height={20} patternUnits="userSpaceOnUse">
            <Rect width={20} height={20} fill={floorColor} />
            <Path d="M 20 0 L 0 0 0 20" fill="none" stroke={gridColor} strokeWidth={0.5} />
          </Pattern>
          
          {/* Wall gradient */}
          <LinearGradient id="wallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={wallColor} />
            <Stop offset="100%" stopColor={wallStroke} />
          </LinearGradient>
        </Defs>

        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill={bgColor} />

        {/* Room floor */}
        <Path d={roomPath} fill="url(#floorGrid)" />

        {/* Room walls with 3D effect */}
        {/* Shadow */}
        <Path
          d={roomPath}
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)'}
          strokeWidth={wallThickness + 4}
          strokeLinejoin="round"
          strokeLinecap="round"
          transform="translate(2, 2)"
        />
        {/* Main wall */}
        <Path
          d={roomPath}
          fill="none"
          stroke="url(#wallGrad)"
          strokeWidth={wallThickness}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Inner highlight */}
        <Path
          d={roomPath}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)'}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Outer edge */}
        <Path
          d={roomPath}
          fill="none"
          stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)'}
          strokeWidth={1}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Doors */}
        {processedData.doors.map((door: any, index) => (
          <G key={`door-${index}`} rotation={door.rotation} origin={`${door.x}, ${door.y}`}>
            {/* Door opening */}
            <Rect
              x={door.x - door.width / 2 - 2}
              y={door.y - wallThickness / 2 - 2}
              width={door.width + 4}
              height={wallThickness + 4}
              fill={floorColor}
            />
            {/* Door frame */}
            <Rect x={door.x - door.width / 2 - 2} y={door.y - 4} width={3} height={8} fill={doorColor} rx={1} />
            <Rect x={door.x + door.width / 2 - 1} y={door.y - 4} width={3} height={8} fill={doorColor} rx={1} />
            {/* Door arc */}
            <Path
              d={`M ${door.x - door.width / 2} ${door.y + 5}
                  A ${door.width * 0.8} ${door.width * 0.8} 0 0 0 
                  ${door.x - door.width / 2 + door.width * 0.6} ${door.y + 5 + door.width * 0.6}`}
              stroke={doorColor}
              strokeWidth={1.5}
              fill="none"
              opacity={0.6}
            />
            <Line
              x1={door.x - door.width / 2}
              y1={door.y + 5}
              x2={door.x - door.width / 2 + door.width * 0.6}
              y2={door.y + 5 + door.width * 0.6}
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
              fill={isDark ? 'rgba(52,152,219,0.15)' : 'rgba(52,152,219,0.1)'}
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
            {/* Pane divider */}
            <Line x1={window.x} y1={window.y - 2} x2={window.x} y2={window.y + 2} stroke={windowColor} strokeWidth={1} />
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
                y1={height - 28}
                x2={processedData.offsetX + processedData.screenWidth}
                y2={height - 28}
                stroke={accentColor}
                strokeWidth={1.5}
              />
              {/* End caps */}
              <Line x1={processedData.offsetX} y1={height - 34} x2={processedData.offsetX} y2={height - 22} stroke={accentColor} strokeWidth={1.5} />
              <Line x1={processedData.offsetX + processedData.screenWidth} y1={height - 34} x2={processedData.offsetX + processedData.screenWidth} y2={height - 22} stroke={accentColor} strokeWidth={1.5} />
              {/* Arrows */}
              <Path d={`M ${processedData.offsetX + 1} ${height - 28} l 5 -3 v 6 z`} fill={accentColor} />
              <Path d={`M ${processedData.offsetX + processedData.screenWidth - 1} ${height - 28} l -5 -3 v 6 z`} fill={accentColor} />
              {/* Label */}
              <Rect x={width / 2 - 25} y={height - 18} width={50} height={16} rx={4} fill={bgColor} />
              <SvgText x={width / 2} y={height - 6} fontSize={11} fill={accentColor} textAnchor="middle" fontWeight="700">
                {formatMeasurement(processedData.roomWidth)}
              </SvgText>
            </G>

            {/* Depth dimension (right) */}
            <G>
              <Line
                x1={width - 28}
                y1={processedData.offsetZ}
                x2={width - 28}
                y2={processedData.offsetZ + processedData.screenDepth}
                stroke={accentColor}
                strokeWidth={1.5}
              />
              {/* End caps */}
              <Line x1={width - 34} y1={processedData.offsetZ} x2={width - 22} y2={processedData.offsetZ} stroke={accentColor} strokeWidth={1.5} />
              <Line x1={width - 34} y1={processedData.offsetZ + processedData.screenDepth} x2={width - 22} y2={processedData.offsetZ + processedData.screenDepth} stroke={accentColor} strokeWidth={1.5} />
              {/* Arrows */}
              <Path d={`M ${width - 28} ${processedData.offsetZ + 1} l -3 5 h 6 z`} fill={accentColor} />
              <Path d={`M ${width - 28} ${processedData.offsetZ + processedData.screenDepth - 1} l -3 -5 h 6 z`} fill={accentColor} />
              {/* Label */}
              <G rotation={-90} origin={`${width - 10}, ${(processedData.offsetZ * 2 + processedData.screenDepth) / 2}`}>
                <Rect x={width - 35} y={(processedData.offsetZ * 2 + processedData.screenDepth) / 2 - 8} width={50} height={16} rx={4} fill={bgColor} />
                <SvgText x={width - 10} y={(processedData.offsetZ * 2 + processedData.screenDepth) / 2 + 4} fontSize={11} fill={accentColor} textAnchor="middle" fontWeight="700">
                  {formatMeasurement(processedData.roomDepth)}
                </SvgText>
              </G>
            </G>
          </G>
        )}

        {/* Legend */}
        <G>
          <Rect x={10} y={10} width={100} height={26} rx={6} fill={isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)'} />
          {/* Door */}
          <Rect x={18} y={18} width={10} height={8} rx={1} fill={doorColor} />
          <SvgText x={33} y={26} fontSize={10} fill={textColor} fontWeight="500">Door</SvgText>
          {/* Window */}
          <Rect x={62} y={19} width={12} height={5} rx={1} fill="none" stroke={windowColor} strokeWidth={1.5} />
          <SvgText x={80} y={26} fontSize={10} fill={textColor} fontWeight="500">Win</SvgText>
        </G>

        {/* Scale bar */}
        <G>
          <Rect x={10} y={height - 34} width={70} height={24} rx={6} fill={isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.9)'} />
          <Line x1={18} y1={height - 18} x2={18 + processedData.scale} y2={height - 18} stroke={textColor} strokeWidth={2} strokeLinecap="round" />
          <Line x1={18} y1={height - 24} x2={18} y2={height - 12} stroke={textColor} strokeWidth={1.5} />
          <Line x1={18 + processedData.scale} y1={height - 24} x2={18 + processedData.scale} y2={height - 12} stroke={textColor} strokeWidth={1.5} />
          <SvgText x={18 + processedData.scale + 8} y={height - 14} fontSize={10} fill={textColor} fontWeight="600">1m</SvgText>
        </G>

        {/* Precision badge */}
        <G>
          <Rect x={width - 65} y={10} width={55} height={20} rx={5} fill={accentColor} opacity={0.12} />
          <SvgText x={width - 38} y={24} fontSize={9} fill={accentColor} textAnchor="middle" fontWeight="600">± 1-2cm</SvgText>
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
});
