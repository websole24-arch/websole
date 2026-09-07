import { useEffect, useRef, useState } from 'react';

const LOAD_TIMEOUT_MS = 6000;

const SITE_TITLE = 'Web_Sole — Websites, UI/UX & Design, priced for your country';
const SITE_DESCRIPTION =
  'Custom website development, UI/UX design, WordPress, Wix, and graphic design services with transparent, country-specific pricing.';

function setMetaDescription(content) {
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'description');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

// Cross-origin JS can't read X-Frame-Options / CSP headers, and some
// browsers still fire `load` on a silently-blocked frame, so there's no
// fully reliable way to detect Blogger refusing to embed. This races
// `onLoad` against a timeout as a best-effort heuristic and always offers
// a direct link either way.
export default function Blog() {
  const blogUrl = import.meta.env.VITE_BLOGGER_URL;
  const [status, setStatus] = useState(blogUrl ? 'loading' : 'unconfigured');
  const timeoutRef = useRef(null);

  useEffect(() => {
    document.title = 'Blog — Web_Sole';
    setMetaDescription('Read the latest articles, updates, and insights from Web_Sole on our blog.');

    let canonical = document.querySelector('link[rel="canonical"]');
    const hadCanonical = Boolean(canonical);
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/blog`);

    return () => {
      // Restore the site-wide defaults from index.html so other pages
      // aren't left with the blog's title/description/canonical.
      document.title = SITE_TITLE;
      setMetaDescription(SITE_DESCRIPTION);
      if (!hadCanonical) canonical.remove();
    };
  }, []);

  useEffect(() => {
    if (!blogUrl) return undefined;
    timeoutRef.current = setTimeout(() => {
      setStatus((prev) => (prev === 'loading' ? 'blocked' : prev));
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timeoutRef.current);
  }, [blogUrl]);

  const handleLoad = () => {
    clearTimeout(timeoutRef.current);
    setStatus('loaded');
  };

  if (!blogUrl) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl">Blog</h1>
        <p className="mt-4 text-muted-light">
          Blog coming soon.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full overflow-x-hidden px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl">Blog</h1>

      <div className="relative mt-6 h-[calc(100vh-180px)] min-h-[700px] w-full max-w-full overflow-hidden rounded-2xl border border-ink/10">
        <iframe
          title="Blog"
          src={blogUrl}
          onLoad={handleLoad}
          loading="lazy"
          style={{ border: 0 }}
          className="absolute inset-0 h-full w-full"
        />

        {status !== 'loaded' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-paper p-10 text-center">
            {status === 'loading' && <p className="text-sm text-muted-light">Loading blog…</p>}
            {status === 'blocked' && (
              <>
                <p className="text-muted-light">
                  The blog can&apos;t be displayed here. You can still read it on Blogger.
                </p>
                <a
                  href={blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-signal px-6 py-3 font-medium text-white transition-opacity hover:opacity-90"
                >
                  Open Blog
                </a>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
