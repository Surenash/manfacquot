import React from 'react';
import { useLoader } from '@react-three/fiber';
import { Center, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { SupportedExtensions } from '../types';

interface LoadedModelProps {
  modelUrl: string;
  fileExtension: SupportedExtensions;
}

const LoadedModel: React.FC<LoadedModelProps> = ({ modelUrl, fileExtension }) => {
  let geometry;
  let model;

  switch (fileExtension) {
    case 'stl':
      geometry = useLoader(STLLoader, modelUrl);
      return (
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial color="royalblue" />
        </mesh>
      );
    case 'obj':
      model = useLoader(OBJLoader, modelUrl);
      // OBJLoader can return a Group, so traverse and apply materials/shadows
       model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // You can assign a material here if needed
            // ((child as THREE.Mesh).material as THREE.MeshStandardMaterial) = new THREE.MeshStandardMaterial({color: 'lightgray'});
        }
      });
      return <primitive object={model} />;
    case 'gltf':
    case 'glb':
      const { scene } = useGLTF(modelUrl);
      // GLTF/GLB models often come with materials, let's just make sure they cast shadows
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
      });
      return <primitive object={scene} />;
    default:
      return null;
  }
};

interface ModelProps {
  modelUrl: string;
  fileExtension: SupportedExtensions;
  onLoad: (payload: { boundingBox: THREE.Box3 }) => void;
}


const Model: React.FC<ModelProps> = ({ modelUrl, fileExtension, onLoad }) => {
  return (
    <Center onCentered={onLoad}>
      <LoadedModel modelUrl={modelUrl} fileExtension={fileExtension} />
    </Center>
  );
};


export default Model;