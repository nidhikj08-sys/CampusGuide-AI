import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: true,
    port: 5173
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true
      },
      includeAssets: ["favicon.png", "apple-touch-icon.png", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "CampusGuide",
        short_name: "CampusGuide",
        description: "Smart campus navigation with indoor maps, timetables, and classroom finder",
        theme_color: "#1a73e8",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        screenshots: [],
        categories: ["education", "navigation"],
shortcuts: [
          {
            name: "Indoor Map",
            short_name: "Map",
            description: "Navigate campus buildings",
            url: "/student",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }]
          },
          {
            name: "Timetable",
            short_name: "Schedule",
            description: "View your class schedule",
            url: "/timetable",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }]
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],
});
