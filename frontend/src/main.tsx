import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { MassMessageProgressProvider } from './contexts/MassMessageProgressContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <MassMessageProgressProvider>
        <App />
      </MassMessageProgressProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
