import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [svelte()],
    server: {
      port: Number(env.VITE_PORT) || 3014,
      historyApiFallback: true,
    },
  }
})
