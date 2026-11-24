import type { MetadataRoute } from "next";

/** Web app manifest: name, colours and icons used by browsers and "Add to home screen". */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Axios Station",
    short_name: "Axios Station",
    description: "Custom software, AI, cloud and business automation for businesses in Bangladesh and beyond.",
    start_url: "/",
    display: "standalone",
    background_color: "#060913",
    theme_color: "#060913",
    icons: [
      { src: "/icon.png", sizes: "any", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
