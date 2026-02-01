// Room3DViewer - Main component for 3D room visualization

import React, { useMemo, useState, Suspense } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { Canvas } from '@react-three/fiber';
import type { Room3DViewerProps, TexturePreset } from './types';
import { processRoomPlanData } from './transforms';
import SceneContent from './SceneContent';

// Loading fallback component
function LoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4DA3E1" />
      <Text style={styles.loadingText}>Loading 3D Scene...</Text>
    </View>
  );
}

// Error fallback component
function ErrorFallback({ message }: { message: string }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export default function Room3DViewer({
  roomData,
  texturePreset = 'modern',
  showFurniture = true,
  width,
  height,
  onLoad,
  onError,
}: Room3DViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Process room data
  const processedData = useMemo(() => {
    try {
      return processRoomPlanData(roomData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process room data';
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
      return null;
    }
  }, [roomData, onError]);
  
  // Handle WebGL not supported
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return <ErrorFallback message="3D viewer is only available on mobile devices" />;
  }
  
  if (error || !processedData) {
    return <ErrorFallback message={error || 'No room data available'} />;
  }
  
  const containerStyle = [
    styles.container,
    width ? { width } : undefined,
    height ? { height } : undefined,
  ];
  
  return (
    <View style={containerStyle}>
      {isLoading && <LoadingFallback />}
      
      <Canvas
        style={styles.canvas}
        shadows
        camera={{ 
          fov: 60,
          near: 0.1,
          far: 100,
        }}
        onCreated={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        gl={{ 
          antialias: true,
          alpha: false,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent
            processedData={processedData}
            texturePreset={texturePreset}
            showFurniture={showFurniture}
          />
        </Suspense>
        
        {/* Background color */}
        <color attach="background" args={['#1a1a1c']} />
      </Canvas>
    </View>
  );
}

// Re-export types for convenience
export type { Room3DViewerProps, TexturePreset, RoomPlanData } from './types';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1c',
    borderRadius: 12,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 28, 0.9)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    color: '#888',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1c',
    padding: 20,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
});
