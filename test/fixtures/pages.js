// Raw collector-shaped pages for analyze(), so shape and verdict run end to end.
const anchors = (paths) => paths.map((p) => `<a href="${p}">link</a>`).join('');
const jsonLd = (type) => `<script type="application/ld+json">{"@context":"https://schema.org","@type":"${type}"}</script>`;
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));

const WP_HEAD = '<meta name="generator" content="WordPress 6.6"><link rel="stylesheet" href="/wp-content/themes/acme/style.css"><script src="/wp-includes/js/jquery/jquery.min.js"></script>';
const SEARCH_FORM = '<form role="search" action="/"><input type="search" name="s"></form>';
const CATEGORY_LINKS = anchors(range(8, (i) => `/category/topic-${i}/`));

export const wpBlog = {
  url: 'https://www.example.com/',
  html: `<html><head>${WP_HEAD}${jsonLd('BlogPosting')}</head><body>${SEARCH_FORM}${CATEGORY_LINKS}${anchors(range(12, (i) => `/2026/05/post-${i}/`))}</body></html>`,
};

export const wpBlogPlainArticleSchema = {
  url: 'https://www.example.com/2026/05/post-1/',
  html: `<html><head>${WP_HEAD}${jsonLd('Article')}</head><body>${SEARCH_FORM}${CATEGORY_LINKS}</body></html>`,
};

export const wpBlogArticlePermalinks = {
  url: 'https://www.example.com/',
  html: `<html><head>${WP_HEAD}${jsonLd('BlogPosting')}</head><body>${SEARCH_FORM}${anchors(range(12, (i) => `/article/post-${i}/`))}</body></html>`,
};

export const wpPricingElementor = {
  url: 'https://www.example.com/pricing/',
  html: `<html><head><meta name="generator" content="Elementor 3.20.0; features: e_optimized_assets_loading"><meta name="generator" content="WordPress 6.6">
    <link rel="stylesheet" href="/wp-content/plugins/elementor/assets/css/frontend.min.css"><link rel="stylesheet" href="/wp-content/uploads/elementor/css/post-7.css">
    <script src="/wp-content/plugins/elementor/assets/js/frontend.min.js"></script>${jsonLd('FAQPage')}</head>
    <body><div data-elementor-type="wp-page">${anchors(range(30, (i) => `/page-${i}/`))}</div></body></html>`,
};

export const elementorMarkersOnly = {
  url: 'https://www.example.com/',
  html: '<html><head><meta name="generator" content="Elementor 3.20.0"></head><body></body></html>',
};

export const betterDocs = {
  url: 'https://www.example.com/docs/',
  html: `<html><head>${WP_HEAD}<link rel="stylesheet" href="/wp-content/plugins/betterdocs/assets/css/style.css"><script src="/wp-content/plugins/betterdocs/assets/js/search.js"></script></head><body></body></html>`,
};

export const betterDocsAlone = {
  url: 'https://www.example.com/docs/',
  html: '<html><head><script src="/wp-content/plugins/betterdocs/assets/js/search.js"></script></head><body></body></html>',
};

export const mediaWiki = {
  url: 'https://wiki.example.org/wiki/Main_Page',
  html: '<html><head><meta name="generator" content="MediaWiki 1.42.1"><link rel="stylesheet" href="/w/load.php?lang=en&amp;modules=site.styles&amp;only=styles"><script src="/w/load.php?lang=en&amp;modules=startup&amp;only=scripts"></script></head><body class="mediawiki ltr sitedir-ltr"></body></html>',
};

export const pluginPage = (slug) => ({
  url: 'https://www.example.com/kb/',
  html: `<html><head><script src="/wp-content/plugins/${slug}/js/app.min.js"></script><link rel="stylesheet" href="/wp-content/plugins/${slug}/css/app.min.css"></head><body></body></html>`,
});

export const wikiEnginePages = {
  dokuwiki: '<html><head><meta name="generator" content="DokuWiki"><link rel="stylesheet" href="/lib/exe/css.php?t=dokuwiki"><script src="/lib/exe/js.php?t=dokuwiki"></script></head><body></body></html>',
  bookstack: '<html><head><link rel="stylesheet" href="/dist/styles.css?version=v26.09.2"><script src="/dist/app.js?version=v26.09.2"></script></head><body><h2 id="bkmrk-intro">Intro</h2></body></html>',
  wikijs: '<html><head><link rel="stylesheet" href="/_assets/css/app.36d23546be6dda64.css"><script src="/_assets/js/runtime.js?1700000000"></script><script src="/_assets/js/app.js?1700000000"></script></head><body></body></html>',
  xwiki: '<html data-xwiki-reference="xwiki:Main.WebHome" data-xwiki-wiki="xwiki"><head><link rel="stylesheet" href="/xwiki/webjars/wiki%3Axwiki/xwiki-platform-tree-webjar/18.4.6/tree.min.css"></head><body></body></html>',
};

export const cmsPages = {
  drupal: { html: '<html><head><meta name="Generator" content="Drupal 11 (https://www.drupal.org)"></head><body><script type="application/json" data-drupal-selector="drupal-settings-json">{}</script></body></html>', headers: { 'x-drupal-cache': 'HIT' } },
  webflow: { html: '<html data-wf-page="abc" data-wf-site="def"><head><meta content="Webflow" name="generator"><link rel="stylesheet" href="https://cdn.prod.website-files.com/abc/css/site.css"></head><body></body></html>' },
  squarespace: { html: '<html><head><link rel="stylesheet" href="https://static1.squarespace.com/static/abc/site.css"><script src="https://assets.squarespace.com/universal/scripts-compressed/site.js"></script></head><body></body></html>', headers: { server: 'Squarespace' } },
  wix: { html: '<html><head><meta name="generator" content="Wix.com Website Builder"><script src="https://static.parastorage.com/services/main.js"></script></head><body></body></html>', headers: { 'x-wix-request-id': '1' } },
  ghost: { html: '<html><head><meta name="generator" content="Ghost 6.0"><script src="https://cdn.jsdelivr.net/ghost/portal@~2.0/umd/portal.min.js"></script></head><body></body></html>', headers: { 'ghost-fastly': 'true' } },
};

export const proseAboutPlatforms = {
  url: 'https://www.example.com/compare/',
  html: `<html><body><p>We compared WordPress, Elementor, Drupal, Webflow, Squarespace, Wix, Ghost, BetterDocs, MediaWiki, DokuWiki, BookStack, Wiki.js and XWiki.</p>
    <pre>&lt;html data-xwiki-reference="xwiki:Main.WebHome"&gt; &lt;div data-elementor-type="wp-page"&gt; &lt;body class="mediawiki"&gt;</pre>
    <a href="https://other.example.org/wp-content/plugins/betterdocs/readme.txt">readme</a></body></html>`,
};

export const unknownKbShaped = {
  url: 'https://help.example.net/',
  html: `<html><head><script src="https://cdn.thirdparty.example/app.js"></script></head><body><input type="search" name="q">${anchors(range(6, (i) => `/articles/${i}-how-to`))}</body></html>`,
  headers: { server: 'nginx' },
};

export const noKbHostingOnly = {
  url: 'https://www.example.net/pricing',
  html: `<html><head>${jsonLd('FAQPage')}</head><body>${anchors(range(10, (i) => `/page-${i}`))}</body></html>`,
  headers: { server: 'cloudflare', 'cf-ray': 'abc' },
};

const NOTION_BODY = '<div id="notion-app"></div>';

export const notionKbShaped = {
  url: 'https://help.example.com/getting-started',
  html: `<html><head>${jsonLd('FAQPage')}</head><body>${NOTION_BODY}</body></html>`,
};

export const notionNotKbShaped = {
  url: 'https://www.example.com/about',
  html: `<html><body>${NOTION_BODY}</body></html>`,
};

export const superNotKbShaped = {
  url: 'https://www.example.com/about',
  html: '<html><head><meta name="generator" content="Super"></head><body></body></html>',
};
