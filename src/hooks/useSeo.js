import { useEffect } from 'react';

// Set VITE_SITE_URL to your production domain. Falls back to the placeholder
// used in index.html / sitemap.xml — update both when the real domain is live.
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://chowdhrysweethouse.in').replace(/\/$/, '');
const SITE_NAME = 'Chowdhry Sweet House';
const DEFAULT_DESCRIPTION =
  'Premium traditional Indian sweets, mithai, namkeen & gift boxes from Chowdhry Sweet House, Gorakhpur. Authentic taste since 1970. Free delivery within 5 km.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

const upsertMeta = (key, keyType, content) => {
  if (content == null) return;
  let el = document.head.querySelector(`meta[${keyType}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(keyType, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertLink = (rel, href) => {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

/**
 * Per-route on-page SEO for this SPA. Sets <title>, description, canonical,
 * robots, and Open Graph / Twitter tags. Dependency-free.
 *
 * usage: useSeo({ title, description, path, image, type, noindex })
 */
export const useSeo = ({ title, description, path = '', image, type = 'website', noindex = false } = {}) => {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} | Best Sweets & Mithai Shop in Gorakhpur`;
    const desc = description || DEFAULT_DESCRIPTION;
    const url = `${SITE_URL}${path}`;
    const img = image || DEFAULT_IMAGE;

    document.title = fullTitle;
    upsertMeta('description', 'name', desc);
    upsertMeta('robots', 'name', noindex ? 'noindex, nofollow' : 'index, follow');
    upsertLink('canonical', url);

    upsertMeta('og:title', 'property', fullTitle);
    upsertMeta('og:description', 'property', desc);
    upsertMeta('og:url', 'property', url);
    upsertMeta('og:type', 'property', type);
    upsertMeta('og:image', 'property', img);

    upsertMeta('twitter:title', 'name', fullTitle);
    upsertMeta('twitter:description', 'name', desc);
    upsertMeta('twitter:image', 'name', img);
  }, [title, description, path, image, type, noindex]);
};

export default useSeo;
