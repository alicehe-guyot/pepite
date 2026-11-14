import type { NextConfig } from "next";

// Cache Components volontairement désactivé : toutes les pages sont privées
// et dynamiques (session Supabase). Voir docs/SPEC.md §10.
const nextConfig: NextConfig = {
  // Garde 30 s une page déjà vue : le retour en arrière est immédiat. Une modification
  // (server action + revalidatePath) vide ce cache, donc rien de périmé après une saisie.
  experimental: {
    staleTimes: { dynamic: 30 },
  },
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
