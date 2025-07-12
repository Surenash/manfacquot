
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import Loader from './Loader';
import { ViewPreset, SupportedExtensions } from '../types';

interface ViewerProps {
  modelUrl: string;
  fileExtension: SupportedExtensions;
  view: ViewPreset;
  isViewLocked: boolean;
  onUserInteraction: () => void;
}

const Viewer: React.FC<ViewerProps> = ({ modelUrl, fileExtension, view, isViewLocked, onUserInteraction }) => {
  return (
    <Suspense fallback={<Loader />}>
      <Canvas
        camera={{ fov: 50 }}
        shadows
        className="w-full h-full"
      >
        <Scene 
          modelUrl={modelUrl} 
          fileExtension={fileExtension} 
          view={view}
          isViewLocked={isViewLocked}
          onUserInteraction={onUserInteraction} 
        />
      </Canvas>
    </Suspense>
  );
};

export default Viewer;
