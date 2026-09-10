import { defineConfig } from 'vite';

export default defineConfig({
  // Relativ statt absolut: der Build laeuft dadurch auch unter einem
  // Subpfad (GitHub Pages: /pixelbonkers-game/). Der Dev-Server
  // behandelt './' als '/', lokale Probes bleiben unberuehrt.
  base: './',
});
