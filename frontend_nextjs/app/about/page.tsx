import AboutClient from "./page.client";
// ---- Metadata (SSR) ----
import { createMetadata } from "@/app/lib/seo";
import { aboutMeta } from "@/data/seo/metadetails";

export const metadata = createMetadata(aboutMeta);
export default function About() {
  return <AboutClient />;
}
