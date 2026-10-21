import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
  // The dev server must not reload the page every time `pnpm build` writes build/.
  server: { watch: { ignored: ["**/build/**", "**/export/**"] } },
});
