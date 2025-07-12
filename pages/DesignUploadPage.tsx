import React, { useState } from 'react';
import { useDesign } from '../contexts/DesignContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DesignUploadPage: React.FC = () => {
  const { setDesignFile } = useDesign();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      setDesignFile(file);
      toast.success('File uploaded successfully!');
      navigate('/viewer');
    } else {
      toast.error('Please select a file to upload.');
    }
  };

  return (
    <div>
      <h1>Upload Your 3D Design</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
};

export default DesignUploadPage;
