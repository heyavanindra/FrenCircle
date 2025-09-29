// data/seo/metadetails.ts
export const siteBase = {
  name: "FrenCircle",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://frencircle.com",
};

export const statusMeta = {
  title: "Service Status",
  description: "Real-time monitoring of FrenCircle services",
  path: "/status",
};

export const docsMeta = {
  title: "Docs",
  description: "FrenCircle documentation",
  path: "/docs",
};

export const homeMeta = {
  title: "Home",
  description: "FrenCircle : All your links in one place.",
  path: "/",
};

export const aboutMeta = {
  title: "About",
  description: "Learn more about FrenCircle",
  path: "/about",
};

const metaDetails = {
  siteBase,
  status: statusMeta,
  docs: docsMeta,
};


export default metaDetails;

