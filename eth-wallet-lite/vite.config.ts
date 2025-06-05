// This file configures Vite, the tool used to run and build the React app.
// It sets up React support, server settings, and path aliases for easier imports.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Export the Vite configuration
export default defineConfig({
  plugins: [react()], // Enable React plugin for Vite
  server: {
    port: 5173, // The app will run on http://localhost:5173
    open: true, // Automatically open the browser when the server starts
    proxy: {
      '/api': 'http://localhost:3001', // Forward API requests to the backend server
    },
  },
  resolve: {
    alias: {
      '@': '/src', // Use '@' to refer to the 'src' folder in imports
    },
  },
});
