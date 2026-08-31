import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

/**
 * Library build configuration for sorokit-ui
 * 
 * Produces:
 * - dist/sorokit-ui.es.js (ES modules)
 * - dist/sorokit-ui.cjs (CommonJS)
 * - dist/sorokit-ui.d.ts (TypeScript definitions)
 * 
 * Use with: vite build --config vite.lib.config.ts
 */
export default defineConfig({
  plugins: [react(), tailwindcss(), dts({
    tsconfigPath: path.resolve(__dirname, "tsconfig.app.json"),
    entryRoot: path.resolve(__dirname, "src"),
    outDirs: ["dist"],
    include: ["src/components", "src/lib"],
  })],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/components/index.ts'),
      name: 'SorokitUI',
      fileName: (format) => `sorokit-ui.${format === 'es' ? 'es.js' : 'cjs'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: (id) =>
        !id.startsWith('.') &&
        !id.startsWith('/') &&
        !id.startsWith('@/') &&
        !id.startsWith('\0'),
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    minify: false,
    sourcemap: true,
    // Preserve specific directory structure
    outDir: 'dist',
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: [
      "sorokit-core",
      "@creit.tech/stellar-wallets-kit",
      "react",
      "react-dom",
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
