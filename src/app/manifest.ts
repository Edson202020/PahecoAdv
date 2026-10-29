import type { MetadataRoute } from "next";

// Permite instalar o sistema no celular como aplicativo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pachecos Advogados | Gestão",
    short_name: "Pachecos",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1f4e8c",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
