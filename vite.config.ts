import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "tick.svg"],
      manifest: {
        name: "ZapGoCart Admin Dashboard",
        short_name: "ZapGoCart",
        description: "Comprehensive business management dashboard for products, offers, and inventory",
        theme_color: "#ffffff",
        icons: [
          {
            src: "tick.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "tick.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
          {
            src: "tick.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
