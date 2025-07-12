import React, { Suspense, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

// Supported file types
const SUPPORTED_FORMATS = [
  '.stl', '.obj', '.gltf', '.glb', '.ply', '.fbx', '.dae', '.3ds'
];

interface ModelProps {
  url: string;
  fileExtension: string;
  onLoad?: (boundingBox: THREE.Box3) => void;
}

const Model: React.FC<ModelProps> = ({ url, fileExtension, onLoad }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const handleLoad = useCallback((object: THREE.Object3D) => {
    if (onLoad) {
      const box = new THREE.Box3().setFromObject(object);
      onLoad(box);
    }
  }, [onLoad]);

  // STL Loader Component
  const STLModel = () => {
    const geometry = React.useMemo(() => {
      const loader = new STLLoader();
      return loader.load(url, handleLoad);
    }, [url]);

    return (
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial color="#4f46e5" metalness={0.1} roughness={0.3} />
      </mesh>
    );
  };

  // OBJ Loader Component
  const OBJModel = () => {
    const object = React.useMemo(() => {
      const loader = new OBJLoader();
      return loader.load(url, (obj) => {
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshStandardMaterial({ 
              color: '#4f46e5',
              metalness: 0.1,
              roughness: 0.3
            });
          }
        });
        handleLoad(obj);
      });
    }, [url]);

    return object ? <primitive object={object} /> : null;
  };

  // PLY Loader Component
  const PLYModel = () => {
    const geometry = React.useMemo(() => {
      const loader = new PLYLoader();
      return loader.load(url, handleLoad);
    }, [url]);

    return (
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial color="#4f46e5" metalness={0.1} roughness={0.3} />
      </mesh>
    );
  };

  // GLTF/GLB Loader Component
  const GLTFModel = () => {
    const { scene } = useGLTF(url);
    
    React.useEffect(() => {
      if (scene) {
        handleLoad(scene);
      }
    }, [scene]);

    return <primitive object={scene} />;
  };

  // Render appropriate model based on file extension
  const renderModel = () => {
    const ext = fileExtension.toLowerCase();
    
    switch (ext) {
      case '.stl':
        return <STLModel />;
      case '.obj':
        return <OBJModel />;
      case '.ply':
        return <PLYModel />;
      case '.gltf':
      case '.glb':
        return <GLTFModel />;
      default:
        return (
          <Text
            position={[0, 0, 0]}
            fontSize={0.5}
            color="red"
            anchorX="center"
            anchorY="middle"
          >
            Unsupported format: {ext}
          </Text>
        );
    }
  };

  return (
    <Center onCentered={({ boundingBox }) => onLoad?.(boundingBox)}>
      {renderModel()}
    </Center>
  );
};

interface ViewerSceneProps {
  modelUrl: string | null;
  fileExtension: string;
}

const ViewerScene: React.FC<ViewerSceneProps> = ({ modelUrl, fileExtension }) => {
  const [cameraDistance, setCameraDistance] = useState(10);
  const { camera } = useThree();

  const handleModelLoad = useCallback((boundingBox: THREE.Box3) => {
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = camera.fov * (Math.PI / 180);
      const distance = (maxDim / (2 * Math.tan(fov / 2))) * 1.5;
      setCameraDistance(distance);
      
      camera.near = distance / 100;
      camera.far = distance * 100;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      
      {/* Model */}
      {modelUrl && (
        <Suspense fallback={
          <Html center>
            <div className="text-white text-lg">Loading model...</div>
          </Html>
        }>
          <Model 
            url={modelUrl} 
            fileExtension={fileExtension}
            onLoad={handleModelLoad}
          />
        </Suspense>
      )}
      
      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={cameraDistance / 10}
        maxDistance={cameraDistance * 10}
      />
      
      {/* Grid */}
      <gridHelper args={[20, 20, '#444444', '#444444']} />
    </>
  );
};

interface ModelViewerProps {
  className?: string;
}

const ModelViewer: React.FC<ModelViewerProps> = ({ className = '' }) => {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [fileExtension, setFileExtension] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    setModelUrl(url);
    setFileExtension(extension || '');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={`relative w-full h-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {!modelUrl ? (
        // File upload area
        <div
          className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed transition-colors cursor-pointer ${
            isDragging 
              ? 'border-blue-400 bg-blue-50/10' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="text-center p-8">
            <div className="mb-4">
              <svg 
                className="w-16 h-16 mx-auto text-blue-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            </div>
            <p className="text-gray-300 text-lg mb-2">Drag & drop 3D model here</p>
            <p className="text-gray-500 text-sm mb-4">or click to browse</p>
            <p className="text-gray-600 text-xs">
              Supports: {SUPPORTED_FORMATS.join(', ')}
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={SUPPORTED_FORMATS.join(',')}
            onChange={handleFileInputChange}
          />
        </div>
      ) : (
        // 3D Viewer
        <>
          <Canvas
            camera={{ position: [5, 5, 5], fov: 50 }}
            shadows
            className="w-full h-full"
          >
            <ViewerScene modelUrl={modelUrl} fileExtension={fileExtension} />
          </Canvas>
          
          {/* Controls overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => {
                setModelUrl(null);
                setFileExtension('');
              }}
              className="px-3 py-2 bg-gray-800/80 text-white rounded-md hover:bg-gray-700/80 transition-colors text-sm"
            >
              Load New Model
            </button>
          </div>
          
          {/* Model info */}
          <div className="absolute bottom-4 left-4 bg-gray-800/80 text-white px-3 py-2 rounded-md text-sm">
            Format: {fileExtension.toUpperCase()}
          </div>
        </>
      )}
    </div>
  );
};

export default ModelViewer;