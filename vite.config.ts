import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: { staff: 'index.html', clientTest: 'client-test.html' } } },
  // Do not serialize server/build environment variables into either browser entry.
})
