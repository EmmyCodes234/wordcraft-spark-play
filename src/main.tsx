import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('main.tsx - React:', React);
console.log('main.tsx - About to render App');
createRoot(document.getElementById("root")!).render(<App />);
