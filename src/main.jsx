// src/main.jsx
// React 19 Application Mount Entry Point

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

import './styles/app.css';
import './styles/themes.css';

const rootEl = document.getElementById('root');
if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
} else {
    console.error('Target container #root not found in document.');
}
