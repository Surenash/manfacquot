import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real application, you would handle authentication here.
    // For now, we'll just navigate to a "logged in" state.
    alert('Logged in successfully!');
    navigate('/'); // Or to a dashboard page
  };

  return (
    <div>
      <h1>Customer Login</h1>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
