import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/servers": "http://127.0.0.1:5001",
      "/api/deploy": "http://127.0.0.1:5001",
      "/terminal": {
        target: "http://127.0.0.1:5001",
        ws: true,
      },
    },
  },
});