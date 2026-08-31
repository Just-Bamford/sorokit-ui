import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/components/index.ts'),
      name: 'SorokitUI',
      fileName: (format) => `sorokit-ui.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // Externalize dependencies that should not be bundled
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        // Provide global variables for UMD/IIFE builds
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        // Output ESM and CJS in separate directories
        dir: 'dist',
      },
    },
    minify: false,
    sourcemap: true,
  },
  optimizeDeps: {
    include: ["sorokit-core", "@creit.tech/stellar-wallets-kit"],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
