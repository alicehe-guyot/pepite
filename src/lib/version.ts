// Version déployée (identifiant Vercel), comparée par l'app ouverte pour se recharger après une mise à jour.
export const VERSION = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";
