// Does this page look like a knowledge base, whatever it is built on?
// Each signal returns a reason string or null. One signal is never enough.
const MIN_SIGNALS = 2;
const MANY_ARTICLE_LINKS = 5;
const MANY_INTERNAL_PAGES = 20;

const KB_SEGMENTS = new Set(['help', 'helpcenter', 'help-center', 'docs', 'doc', 'documentation', 'support', 'kb', 'wiki', 'knowledge', 'knowledgebase', 'knowledge-base']);
const LOCALE_SEG = /^[a-z]{2}(?:[-_][a-z]{2,4})?$/i;

// Article links on these pages are a blog or news feed, not a KB index.
const FEED_TYPES = ['Blog', 'BlogPosting', 'LiveBlogPosting', 'NewsArticle'];
const KB_ARTICLE_TYPES = ['Article', 'TechArticle'];

function kbHostLabel(hostname) {
  // The registrable domain and TLD say nothing: docs.example, example.help, and example.wiki are not KB hosts.
  return hostname.toLowerCase().split('.').slice(0, -2).find((label) => KB_SEGMENTS.has(label)) || null;
}

function kbPathSegment(pathname) {
  // Only the leading segment counts, so /category/support/ and /blog/help/ stay out.
  const segs = pathname.toLowerCase().split('/').filter(Boolean);
  const first = LOCALE_SEG.test(segs[0] || '') ? segs[1] : segs[0];
  return KB_SEGMENTS.has(first) ? first : null;
}

const SIGNALS = [
  ({ host, path }) => (host ? `host label "${host}"` : path ? `path segment "${path}"` : null),
  ({ types }) => {
    const found = ['FAQPage', 'HowTo'].filter((t) => types.includes(t));
    return found.length ? `${found.join(' and ')} JSON-LD` : null;
  },
  ({ structure }) => (structure.versioning.detected ? 'version switcher' : null),
  ({ articleLinks, isFeed }) => (articleLinks >= MANY_ARTICLE_LINKS && !isFeed ? `${articleLinks} article links` : null),
  ({ articleLinks, isFeed, structure }) => (articleLinks >= MANY_ARTICLE_LINKS && !isFeed && structure.search ? 'search alongside article links' : null),
  ({ host, path, types, isFeed }) => ((host || path) && !isFeed && KB_ARTICLE_TYPES.some((t) => types.includes(t)) ? 'Article JSON-LD at a KB-style location' : null),
  ({ host, structure }) => (host && structure.internalPages >= MANY_INTERNAL_PAGES ? `${structure.internalPages} internal pages on a KB-style host` : null),
];

export function kbShape({ url, structure, aiReadiness }) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { looksLikeKb: false, reasons: [] };
  }
  const types = aiReadiness.jsonLd.types;
  const context = {
    host: kbHostLabel(parsed.hostname),
    path: kbPathSegment(parsed.pathname),
    types,
    isFeed: FEED_TYPES.some((t) => types.includes(t)),
    articleLinks: structure.counts.articles || 0,
    structure,
  };
  const reasons = SIGNALS.map((signal) => signal(context)).filter(Boolean);
  return { looksLikeKb: reasons.length >= MIN_SIGNALS, reasons };
}
