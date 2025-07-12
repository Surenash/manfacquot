
import React, { useState, useCallback, DragEvent } from 'react';
import Viewer from './components/Viewer';
import { ViewPreset, SupportedExtensions } from './types';
import { SUPPORTED_FILES } from './constants';
import { FileUploadIcon, CubeIcon } from './components/Icons';

const App: React.FC = () => {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [fileExtension, setFileExtension] = useState<SupportedExtensions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetView, setTargetView] = useState<ViewPreset>(ViewPreset.ISO);
  const [isViewLocked, setIsViewLocked] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const resetState = () => {
    if (modelUrl) {
      URL.revokeObjectURL(modelUrl);
    }
    setModelFile(null);
    setModelUrl(null);
    setFileExtension(null);
    setError(null);
    setTargetView(ViewPreset.ISO);
    setIsViewLocked(true);
  };

  const handleFile = useCallback((file: File) => {
    resetState();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension && SUPPORTED_FILES.includes(`.${extension}`)) {
      const validExtension = extension as SupportedExtensions;
      setFileExtension(validExtension);
      setModelFile(file);
      setModelUrl(URL.createObjectURL(file));
      setError(null);
    } else {
      setError(`Unsupported file type. Please upload one of: ${SUPPORTED_FILES.join(', ')}. SLDPRT files are not supported.`);
    }
  }, [modelUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleUserInteraction = useCallback(() => {
    setIsViewLocked(false);
  }, []);

  const handlePresetClick = (preset: ViewPreset) => {
    setTargetView(preset);
    setIsViewLocked(true);
  };

  // When a model is loaded, the layout changes to full-screen viewer mode.
  if (modelUrl && fileExtension) {
    return (
      <div className="w-screen h-screen bg-brand-bg font-sans relative">
        {/* The Viewer now renders directly into the full-screen container */}
        <div className="absolute inset-0 z-0">
          <Viewer 
            modelUrl={modelUrl} 
            fileExtension={fileExtension} 
            view={targetView} 
            isViewLocked={isViewLocked}
            onUserInteraction={handleUserInteraction}
          />
        </div>
        
        {/* UI elements are overlaid on top of the viewer */}
        <header className="absolute top-0 left-0 right-0 p-4 z-20">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CubeIcon className="w-8 h-8 text-brand-primary" />
              <h1 className="text-2xl font-bold text-white [text-shadow:_0_1px_3px_rgb(0_0_0_/_0.5)]">3D Model Viewer</h1>
            </div>
            <button
              onClick={resetState}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg"
            >
              Load Another Model
            </button>
          </div>
        </header>

        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white p-3 rounded-lg shadow-lg z-30 max-w-md text-center">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="absolute -top-1 -right-1 font-bold bg-red-700 rounded-full h-6 w-6 flex items-center justify-center">x</button>
          </div>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-brand-surface bg-opacity-70 backdrop-blur-sm p-2 rounded-xl shadow-lg flex gap-2 z-10">
          {Object.values(ViewPreset).map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                isViewLocked && targetView === preset ? 'bg-brand-primary text-white' : 'bg-brand-secondary text-brand-text hover:bg-gray-600'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default view: Centered upload prompt
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg font-sans">
      <header className="p-4 bg-brand-surface shadow-md z-20">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CubeIcon className="w-8 h-8 text-brand-primary" />
            <h1 className="text-2xl font-bold text-brand-text">3D Model Viewer</h1>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 relative">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white p-3 rounded-lg shadow-lg z-30 max-w-md text-center">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="absolute -top-1 -right-1 font-bold bg-red-700 rounded-full h-6 w-6 flex items-center justify-center">x</button>
          </div>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`w-full max-w-2xl h-80 border-4 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors ${
            isDragging ? 'border-brand-primary bg-brand-surface' : 'border-brand-secondary'
          }`}
        >
          <FileUploadIcon className="w-16 h-16 text-brand-text-muted mb-4" />
          <p className="text-xl text-brand-text-muted">Drag & Drop your 3D model here</p>
          <p className="text-brand-text-muted my-2">or</p>
          <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept={SUPPORTED_FILES.join(',')} />
          <label htmlFor="file-upload" className="cursor-pointer px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-blue-600 transition-colors">
            Browse Files
          </label>
          <p className="mt-4 text-sm text-brand-text-muted">Supported: STL, OBJ, GLTF, GLB</p>
          <p className="text-xs text-brand-text-muted mt-1">(SLDPRT is not supported due to its proprietary format)</p>
        </div>
      </main>
    </div>
  );
};

export default App;
