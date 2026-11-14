import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pépite",
    short_name: "Pépite",
    description: "Offrir sans corvée, recevoir sans déception.",
    start_url: "/agenda",
    display: "standalone",
    background_color: "#fde2ec",
    theme_color: "#fffbf8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
