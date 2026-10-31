import type { NextConfig } from "next";

// Cache Components volontairement désactivé : toutes les pages sont privées
// et dynamiques (session Supabase). Voir docs/SPEC.md §10.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
