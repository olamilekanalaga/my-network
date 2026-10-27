// Static demo build only. The full Next.js application remains the primary app.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import tailwind from "@tailwindcss/postcss";
export default defineConfig({
  root: path.resolve("preview"),
  publicDir: path.resolve("public"),
  plugins: [react()],
  css: { postcss: { plugins: [tailwind({ base: path.resolve(".") })] } },
  resolve: { alias: { "@": path.resolve(".") } },
  define: {
    "process.env.NEXT_PUBLIC_SUPABASE_URL": '""',
    "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": '""',
    "process.env.NEXT_PUBLIC_APP_URL": '""',
  },
  build: {
    outDir: path.resolve("dist"),
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        main: path.resolve("preview/index.html"),
        mobile: path.resolve("preview/mobile.html"),
      },
    },
  },
  server: { allowedHosts: ["terminal.local"] },
});
