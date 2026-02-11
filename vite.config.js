import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
export default defineConfig({
    plugins: [
        vue(),
        crx({ manifest: manifest })
    ],
    resolve: {
        alias: {
            '@': '/src'
        }
    },
    css: {
        postcss: {
            plugins: [tailwindcss, autoprefixer]
        }
    },
    build: {
        target: 'chrome88',
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    },
    define: {
        '__INTLIFY_JIT_COMPILATION__': false,
        '__INTLIFY_DROP_MESSAGE_COMPILER__': true,
        '__VUE_I18N_FULL_INSTALL__': false,
        '__VUE_I18N_LEGACY_API__': false
    }
});
