import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./", // Optional, helps with proper routing
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  build: {
    outDir: "public/dist",
    emptyOutDir: true,
  },
  server: {
    host: "localhost",
    port: process.env.FRONTEND_PORT,
    proxy: {
      "^/api(/|(\\?.*)?$)": {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
