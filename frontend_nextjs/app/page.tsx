// app/docs/page.tsx — server wrapper
// Keep metadata and SSR-safe values here; UI lives in the client component.
import { createMetadata } from "@/app/lib/seo";
import { homeMeta } from "@/data/seo/metadetails";
import HomeClient from "./page.client";

export const metadata = createMetadata(homeMeta);

export default function Home() {
  // Server component: render the client component for interactive UI.
  return <HomeClient />;
}
