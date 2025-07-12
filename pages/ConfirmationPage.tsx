import React from 'react';
import { useNavigate } from 'react-router-dom';

const ConfirmationPage: React.FC = () => {
  const navigate = useNavigate();

  const handleProceed = () => {
    navigate('/specifications');
  };

  return (
    <div>
      <h1>Confirmation</h1>
      <p>Your design has been uploaded and is ready for the next step.</p>
      <button onClick={handleProceed}>Proceed to Specifications</button>
    </div>
  );
};

export default ConfirmationPage;
