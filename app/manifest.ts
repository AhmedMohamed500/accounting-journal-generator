import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/ar/service-point",
    name: "FINORA",
    short_name: "FINORA",
    description: "إدارة نقاط الخدمات والورديات والسيولة والربح محليًا",
    start_url: "/ar/service-point",
    scope: "/",
    display: "standalone",
    background_color: "#eef3f8",
    theme_color: "#082c52",
    orientation: "portrait-primary",
    lang: "ar",
    dir: "rtl",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/finora-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/finora-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/finora-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "نقطة الخدمات", short_name: "الخدمات", url: "/ar/service-point", icons: [{ src: "/finora-icon-192.png", sizes: "192x192" }] },
      { name: "لوحة المالك", short_name: "المالك", url: "/ar/service-point/owner-dashboard", icons: [{ src: "/finora-icon-192.png", sizes: "192x192" }] },
      { name: "تجربة 5 دقائق", short_name: "Demo", url: "/ar/service-point/demo", icons: [{ src: "/finora-icon-192.png", sizes: "192x192" }] },
    ],
  };
}
