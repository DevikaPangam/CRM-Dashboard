import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { CRMProvider } from './context/CRMContext';
import { RBACProvider } from './context/RBACContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <CRMProvider>
        <RBACProvider>
          <App />
        </RBACProvider>
      </CRMProvider>
    </AuthProvider>
  </React.StrictMode>
);
