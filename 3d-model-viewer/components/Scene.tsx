
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import Model from './Model';
import { ViewPreset, SupportedExtensions } from './types';
import { CAMERA_VIEW_DIRECTIONS } from '../constants';

interface SceneProps {
  modelUrl: string;
  fileExtension: SupportedExtensions;
  view: ViewPreset;
  isViewLocked: boolean;
  onUserInteraction: () => void;
}

const Scene: React.FC<SceneProps> = ({ modelUrl, fileExtension, view, isViewLocked, onUserInteraction }) => {
  const { camera, controls } = useThree();
  const targetPosition = useRef(new THREE.Vector3(5, 5, 5)); // Sensible default initial position
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const [modelBounds, setModelBounds] = useState<THREE.Box3 | null>(null);
  const [cameraDistance, setCameraDistance] = useState(10); // Sensible default distance

  const handleModelLoad = useCallback((payload: { boundingBox: THREE.Box3 }) => {
    setModelBounds(payload.boundingBox);

    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const size = new THREE.Vector3();
    payload.boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Fit object to view using camera FOV
    const fov = camera.fov * (Math.PI / 180);
    // Add a 20% buffer for padding
    const distance = (maxDim / (2 * Math.tan(fov / 2))) * 1.2;

    setCameraDistance(distance);

    // Adjust clipping planes for the new distance to prevent flickering
    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();

  }, [camera]);

  // Listen for user interaction with camera controls to "unlock" the view
  useEffect(() => {
    if (controls) {
      const handleStart = () => {
        onUserInteraction();
      };
      // The controls object from useThree is an EventDispatcher
      (controls as any).addEventListener('start', handleStart);
      return () => {
        (controls as any).removeEventListener('start', handleStart);
      };
    }
  }, [controls, onUserInteraction]);

  useEffect(() => {
    // Use the dynamically calculated distance, or a default value before the model loads
    const distance = modelBounds ? cameraDistance : 10;
    const direction = CAMERA_VIEW_DIRECTIONS[view];
    targetPosition.current.copy(direction).multiplyScalar(distance);
  }, [view, modelBounds, cameraDistance]);

  useFrame((state, delta) => {
    // Smoothly interpolate camera position ONLY when locked to a preset
    if (isViewLocked && !state.camera.position.equals(targetPosition.current)) {
      state.camera.position.lerp(targetPosition.current, 0.1);
      // Ensure controls are updated after manual camera movement
      if (controls) (controls as any).update();
    }
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight 
        position={[cameraDistance, cameraDistance, cameraDistance / 2]} 
        intensity={2.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-cameraDistance, -cameraDistance, -cameraDistance / 2]} intensity={1} />
      
      <Model modelUrl={modelUrl} fileExtension={fileExtension} onLoad={handleModelLoad} />
      
      <OrbitControls
        makeDefault
        target={targetLookAt.current}
        minDistance={cameraDistance / 10}
        maxDistance={cameraDistance * 10}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
      />

      <Grid
        infiniteGrid
        cellSize={cameraDistance / 10}
        sectionSize={cameraDistance}
        sectionColor={"#4f4f4f"}
        fadeDistance={cameraDistance * 3}
        fadeStrength={2}
      />
    </>
  );
};

export default Scene;
