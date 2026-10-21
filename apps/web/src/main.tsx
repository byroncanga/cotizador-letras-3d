import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/manrope';
import './styles.css';
import { App } from './App';
import { WorkspaceProvider } from './state/workspace';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><WorkspaceProvider><App/></WorkspaceProvider></React.StrictMode>);
