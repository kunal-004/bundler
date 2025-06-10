import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
        },
      },
    },
  },
  server: {
    host: "localhost",
    port: process.env.FRONTEND_PORT || 3000,
    proxy: {
      "^/api(/|(\\?.*)?$)": {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT || 8000}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(
      process.env.NODE_ENV === "production"
        ? ""
        : `http://localhost:${process.env.BACKEND_PORT || 8000}`
    ),
  },
});
