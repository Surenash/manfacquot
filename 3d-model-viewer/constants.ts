import { Vector3 } from 'three';
import { ViewPreset } from './types';

export const CAMERA_VIEW_DIRECTIONS: Record<ViewPreset, Vector3> = {
  [ViewPreset.ISO]: new Vector3(1, 1, 1).normalize(),
  [ViewPreset.TOP]: new Vector3(0, 1, 0.0001).normalize(),
  [ViewPreset.FRONT]: new Vector3(0, 0, 1).normalize(),
  [ViewPreset.RIGHT]: new Vector3(1, 0, 0).normalize(),
  [ViewPreset.LEFT]: new Vector3(-1, 0, 0).normalize(),
};

export const SUPPORTED_FILES = ['.stl', '.obj', '.gltf', '.glb'];
