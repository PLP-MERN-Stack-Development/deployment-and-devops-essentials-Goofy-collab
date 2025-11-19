import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Server configuration for development
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
  
  // Build optimizations
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for production debugging (set to false for smaller builds)
    sourcemap: false,
    
    // Minify options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Code splitting configuration
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'socket-vendor': ['socket.io-client'],
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`
          } else if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // Asset optimization
    assetsInlineLimit: 4096, // 4kb - inline smaller assets as base64
    
    // CSS code splitting
    cssCodeSplit: true,
  },
  
  // Environment variable prefix
  envPrefix: 'VITE_',
  
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'socket.io-client'],
  },
});


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import { visualizer } from 'rollup-plugin-visualizer'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     react(),
//     // Bundle size analyzer (optional)
//     visualizer({
//       open: false,
//       gzipSize: true,
//       brotliSize: true,
//     })
//   ],
  
//   // Server configuration for development
//   server: {
//     port: 5173,
//     strictPort: true,
//     host: true,
//   },
  
//   // Build optimizations
//   build: {
//     // Output directory
//     outDir: 'dist',
    
//     // Generate source maps for production debugging
//     sourcemap: false,
    
//     // Minify options
//     minify: 'terser',
//     terserOptions: {
//       compress: {
//         drop_console: true, // Remove console.logs in production
//         drop_debugger: true,
//       },
//     },
    
//     // Chunk size warnings
//     chunkSizeWarningLimit: 1000,
    
//     // Code splitting configuration
//     rollupOptions: {
//       output: {
//         // Manual chunks for better caching
//         manualChunks: {
//           // Vendor chunks
//           'react-vendor': ['react', 'react-dom'],
//           'socket-vendor': ['socket.io-client'],
//         },
        
//         // Asset file naming
//         assetFileNames: (assetInfo) => {
//           const info = assetInfo.name.split('.')
//           const ext = info[info.length - 1]
//           if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
//             return `assets/images/[name]-[hash][extname]`
//           } else if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
//             return `assets/fonts/[name]-[hash][extname]`
//           }
//           return `assets/[name]-[hash][extname]`
//         },
        
//         // Chunk file naming
//         chunkFileNames: 'assets/js/[name]-[hash].js',
//         entryFileNames: 'assets/js/[name]-[hash].js',
//       },
//     },
    
//     // Asset optimization
//     assetsInlineLimit: 4096, // 4kb - inline smaller assets as base64
    
//     // CSS code splitting
//     cssCodeSplit: true,
//   },
  
//   // Environment variable prefix
//   envPrefix: 'VITE_',
  
//   // Performance optimizations
//   optimizeDeps: {
//     include: ['react', 'react-dom', 'socket.io-client'],
//   },
// });


// // import { defineConfig } from 'vite'
// // import react from '@vitejs/plugin-react'

// // // https://vite.dev/config/
// // export default defineConfig({
// //   plugins: [react()],
// //    server: {
// //     port: 5173,
// //   },
// // })
