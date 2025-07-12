import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { DesignProvider } from './contexts/DesignContext';
import DesignUploadPage from './pages/DesignUploadPage';
import ViewerPage from './pages/ViewerPage';
import ConfirmationPage from './pages/ConfirmationPage';
import SpecificationsPage from './pages/SpecificationsPage';
import LoginPage from './pages/LoginPage';
import { Toaster } from 'react-hot-toast';

const router = createBrowserRouter([
  {
    path: '/',
    element: <DesignUploadPage />,
  },
  {
    path: '/viewer',
    element: <ViewerPage />,
  },
  {
    path: '/confirmation',
    element: <ConfirmationPage />,
  },
  {
    path: '/specifications',
    element: <SpecificationsPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <DesignProvider>
      <Toaster position="bottom-right" />
      <RouterProvider router={router} />
    </DesignProvider>
  </React.StrictMode>
);
