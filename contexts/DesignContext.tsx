import React, { createContext, useContext, useState } from 'react';

interface DesignContextType {
  designFile: File | null;
  setDesignFile: (file: File | null) => void;
  designS3Url: string | null;
  setDesignS3Url: (url: string | null) => void;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export const DesignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designS3Url, setDesignS3Url] = useState<string | null>(null);

  return (
    <DesignContext.Provider value={{ designFile, setDesignFile, designS3Url, setDesignS3Url }}>
      {children}
    </DesignContext.Provider>
  );
};

export const useDesign = () => {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  return context;
};
