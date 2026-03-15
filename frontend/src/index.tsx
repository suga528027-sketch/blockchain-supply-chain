import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { GoogleOAuthProvider } from '@react-oauth/google';

// Suppress MetaMask extension errors from crashing the UI
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && (
    (typeof event.reason.message === 'string' && event.reason.message.includes('MetaMask')) || 
    (typeof event.reason.stack === 'string' && event.reason.stack.includes('nkbihfbeogaeaoehlefnkodbefgpgknn'))
  )) {
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="399311351842-m2d1ga59mlh7imaadjee3eio0p34trb2.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
