export default async function Head({ params }: { params: { slug?: string } }) {
  const username = params?.slug ?? "profile";

  // Try to fetch public user data from the same API used by the client.
  // Assumption: an env var NEXT_PUBLIC_API_URL may be set to the API base (e.g. https://api.frencircle.com).
  // If not present, the code falls back to a relative path (same origin) - adjust as needed for your deployment.
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
  let userData: any = null;

  try {
    const res = await fetch(`${apiBase}/user/${encodeURIComponent(username)}/public`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      userData = json?.data ?? null;
    }
  } catch {
    // swallow errors and continue with fallbacks
  }

  const displayName = userData ? ([userData.firstName, userData.lastName].filter(Boolean).join(' ') || userData.username) : username;
  const title = `${displayName} — frenCircle`;
  const description = `${displayName}'s frenCircle page: links, socials, and profile.`;
  const keywords = `frenCircle, links, profile, ${username}`;

  // Prefer avatarUrl from API if available; use it verbatim (assumed to be a full URL).
  const image = userData?.avatarUrl ?? `https://frencircle.com/og/${encodeURIComponent(username)}.png`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="profile" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}

