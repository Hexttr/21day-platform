import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress AbortError from Supabase Web Locks API - this is normal during initialization
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError' && 
      event.reason?.message?.includes('signal is aborted')) {
    console.log('[App] Suppressed AbortError from Web Locks API (normal behavior)');
    event.preventDefault();
  }
});

// Note: StrictMode removed to prevent double mount/unmount that conflicts with Supabase Web Locks API
createRoot(document.getElementById("root")!).render(<App />);
