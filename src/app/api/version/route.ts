import { VERSION } from "@/lib/version";

// Version déployée : l'app ouverte la compare à la sienne pour se recharger après une mise à jour.
export function GET() {
  return Response.json({ version: VERSION }, { headers: { "Cache-Control": "no-store" } });
}
