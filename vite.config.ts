import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'

// Get the latest commit hash and date for versioning
const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
const buildDate = new Date().toISOString().split('T')[0];
const appVersion = `${buildDate}-${commitHash}`;

// https://vite.dev/config/
export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(appVersion),
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            manifest: {
                name: 'SunSar Bingo 2026',
                short_name: 'Bingo',
                description: 'SunSar Bingo Board 2026',
                theme_color: '#0f172a',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
})
