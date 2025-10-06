import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureAnonymousAuth } from "./lib/firebase";

ensureAnonymousAuth(); //  adds anonymous sign-in before render


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
