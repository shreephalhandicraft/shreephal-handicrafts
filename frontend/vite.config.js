import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // Faster than babel
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    
    // Gzip compression
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240, // Only compress files > 10KB
      deleteOriginFile: false
    }),
    
    // Brotli compression (better than gzip)
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240,
      deleteOriginFile: false
    }),
    
    // Bundle analyzer (generates dist/stats.html)
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  
  build: {
    target: "es2015",
    minify: "terser",
    
    // Terser options for advanced minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.* in production
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      format: {
        comments: false // Remove comments
      }
    },
    
    // Manual chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          "vendor-react": [
            "react",
            "react-dom",
            "react-router-dom"
          ],
          
          // Radix UI components (heavy)
          "vendor-ui": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast"
          ],
          
          // Backend/API libraries
          "vendor-supabase": [
            "@supabase/supabase-js",
            "@tanstack/react-query"
          ],
          
          // Utility libraries
          "vendor-utils": [
            "date-fns",
            "zod",
            "clsx",
            "tailwind-merge",
            "lucide-react"
          ],
          
          // Form libraries
          "vendor-forms": [
            "react-hook-form",
            "@hookform/resolvers"
          ]
        },
        
        // Naming pattern for chunks
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]"
      }
    },
    
    // Warn if chunk is larger than 500KB
    chunkSizeWarningLimit: 500,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Disable sourcemap in production
    sourcemap: false,
    
    // Optimize CSS
    cssMinify: true
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query"
    ],
    exclude: ["@lovable-tagger"]
  },
  
  // Development server config
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  
  // Preview server config
  preview: {
    port: 4173
  }
});
