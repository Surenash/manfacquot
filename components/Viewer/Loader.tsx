
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-bg bg-opacity-80 backdrop-blur-sm z-50">
      <div className="w-16 h-16 border-4 border-t-brand-primary border-brand-secondary rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-brand-text">Loading Model...</p>
    </div>
  );
};

export default Loader;
