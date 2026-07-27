import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // base: './' faz o build funcionar mesmo aberto de uma pasta qualquer,
  // sem precisar estar na raiz de um dominio.
  base: './',
  // A pasta assets guarda a marca. O conteudo dela e servido na raiz do site,
  // entao assets/logo.svg fica acessivel como /logo.svg.
  publicDir: 'assets',
  server: {
    port: 5173,
    open: true,
  },
})
