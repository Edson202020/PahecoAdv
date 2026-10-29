import type { MetadataRoute } from "next";

// Permite instalar o sistema no celular como aplicativo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pachecos Advogados | Gestão",
    short_name: "Pachecos",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2e2a25",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
