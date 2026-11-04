import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze } from '../src/signals.js';
import { match, primaryPlatform } from '../src/matcher.js';
import { platformVerdict } from '../src/verdict.js';
import { kbShape } from '../src/kb-shape.js';
import * as pages from './fixtures/pages.js';
import * as fx from './fixtures/signals.js';

const rules = JSON.parse(readFileSync(new URL('../src/rules.json', import.meta.url), 'utf8'));
const run = (page) => analyze(page, rules);
const byId = (report, id) => report.results.find((r) => r.id === id);

const shapeOf = (url, { types = [], articles = null, internalPages = 0, search = false, versioned = false } = {}) =>
  kbShape({
    url,
    aiReadiness: { jsonLd: { types } },
    structure: { counts: { articles }, internalPages, search, versioning: { detected: versioned } },
  });

test('state: KB rule match shows the product, a confidence pill, and evidence', () => {
  const v = platformVerdict(match(fx.zendeskCustomDomain, rules), { looksLikeKb: true, reasons: [] });
  assert.equal(v.state, 'kb');
  assert.equal(v.label, 'Knowledge base platform');
  assert.equal(v.headline, 'Zendesk Guide');
  assert.equal(v.confidence, 'high');
  assert.match(v.supporting, /^cname: support\.example\.com/);
  assert.equal(v.noRule, false);
});

test('state: CMS without a KB plugin is a site platform', () => {
  const r = run(pages.wpBlog);
  assert.equal(r.platform, null);
  assert.deepEqual(
    { state: r.verdict.state, label: r.verdict.label, headline: r.verdict.headline, confidence: r.verdict.confidence, supporting: r.verdict.supporting, noRule: r.verdict.noRule },
    { state: 'cms', label: 'Site platform', headline: 'WordPress', confidence: null, supporting: 'General-purpose CMS. No KB plugin detected.', noRule: false },
  );
});

test('state: no rule, KB-shaped page', () => {
  const r = run(pages.unknownKbShaped);
  assert.equal(r.shape.looksLikeKb, true);
  assert.deepEqual(r.verdict, {
    state: 'unknown-kb',
    label: 'Knowledge base platform',
    headline: 'Unknown platform',
    confidence: null,
    supporting: 'Looks like a knowledge base. Raw clues below.',
    noRule: true,
  });
});

test('state: no rule, not KB-shaped, and hosting-only matches still count as no rule', () => {
  const r = run(pages.noKbHostingOnly);
  assert.ok(byId(r, 'cloudflare'), 'fixture should match a hosting rule');
  assert.equal(r.shape.looksLikeKb, false);
  assert.deepEqual(r.verdict, {
    state: 'no-kb',
    label: 'Knowledge base platform',
    headline: 'No knowledge base detected',
    confidence: null,
    supporting: 'No rule matched on this page. Raw clues below.',
    noRule: true,
  });
});

test('the unknownSite signal fixture still yields no platform and reads as no knowledge base', () => {
  const v = platformVerdict(match(fx.unknownSite, rules), { looksLikeKb: false, reasons: [] });
  assert.equal(v.state, 'no-kb');
});

test('general-purpose flag: only Notion and Super carry it', () => {
  const flagged = rules.technologies.filter((t) => t.generalPurpose).map((t) => t.id).sort();
  assert.deepEqual(flagged, ['notion', 'super']);
});

test('Notion on a KB-shaped page behaves as a normal KB match', () => {
  const r = run(pages.notionKbShaped);
  assert.equal(r.shape.looksLikeKb, true);
  assert.equal(r.verdict.state, 'kb');
  assert.equal(r.verdict.headline, 'Notion');
  assert.match(r.verdict.supporting, /^html:/);
});

test('Notion off a KB-shaped page keeps the name with a caution', () => {
  const r = run(pages.notionNotKbShaped);
  assert.equal(r.shape.looksLikeKb, false);
  assert.equal(r.verdict.state, 'kb-general-purpose');
  assert.equal(r.verdict.label, 'Knowledge base platform');
  assert.equal(r.verdict.headline, 'Notion');
  assert.equal(r.verdict.supporting, 'May not be a knowledge base.');
  assert.equal(r.verdict.noRule, false);
});

test('Super off a KB-shaped page keeps the name with a caution', () => {
  const r = run(pages.superNotKbShaped);
  assert.equal(r.verdict.headline, 'Super (Notion sites)');
  assert.equal(r.verdict.supporting, 'May not be a knowledge base.');
});

test('a general-purpose match beside a dedicated KB match gets no caution', () => {
  const results = [
    { id: 'notion', name: 'Notion', category: 'kb', generalPurpose: true, score: 80, confidence: 'medium', evidence: ['html: x'] },
    { id: 'gitbook', name: 'GitBook', category: 'kb', generalPurpose: false, score: 60, confidence: 'medium', evidence: ['scriptSrc: y'] },
  ];
  assert.equal(platformVerdict(results, { looksLikeKb: false, reasons: [] }).state, 'kb');
});

test('WordPress blog: CMS row, shape false', () => {
  const r = run(pages.wpBlog);
  assert.equal(r.structure.counts.categories, 8, 'GENERIC_LINKS keeps counting /category/ links');
  assert.equal(r.shape.looksLikeKb, false);
  assert.equal(r.verdict.headline, 'WordPress');
});

test('WordPress blog with a plain Article schema and /category/ links: shape false', () => {
  const r = run(pages.wpBlogPlainArticleSchema);
  assert.deepEqual(r.aiReadiness.jsonLd.types, ['Article']);
  assert.equal(r.shape.looksLikeKb, false);
  assert.deepEqual(r.shape.reasons, []);
});

test('WordPress blog with /article/ permalinks and search: shape false', () => {
  const r = run(pages.wpBlogArticlePermalinks);
  assert.equal(r.structure.counts.articles, 12);
  assert.equal(r.structure.search, true);
  assert.equal(r.shape.looksLikeKb, false);
});

test('WordPress pricing page with Elementor: base CMS first, FAQPage alone is not enough', () => {
  const r = run(pages.wpPricingElementor);
  assert.equal(r.verdict.state, 'cms');
  assert.equal(r.verdict.headline, 'WordPress + Elementor');
  assert.ok(byId(r, 'elementor').score > 0);
  assert.equal(r.shape.looksLikeKb, false);
  assert.deepEqual(r.shape.reasons, ['FAQPage JSON-LD']);
});

test('implied-only WordPress is named once, before the builder', () => {
  const r = run(pages.elementorMarkersOnly);
  assert.equal(byId(r, 'wordpress').score, 0);
  assert.equal(r.verdict.headline, 'WordPress + Elementor');
});

test('WordPress with its own markers and implied by Elementor is named once', () => {
  const r = run(pages.wpPricingElementor);
  assert.ok(byId(r, 'wordpress').score > 0);
  assert.deepEqual(byId(r, 'wordpress').impliedBy, ['elementor']);
  assert.equal(r.verdict.headline.match(/WordPress/g).length, 1);
});

test('BetterDocs: KB row, WordPress in the CMS layer', () => {
  const r = run(pages.betterDocs);
  assert.equal(r.verdict.state, 'kb');
  assert.equal(r.verdict.headline, 'BetterDocs');
  assert.equal(r.verdict.label, 'Knowledge base platform');
  assert.equal(r.platform.id, 'betterdocs');
  assert.equal(byId(r, 'wordpress').category, 'cms');
});

test('BetterDocs alone still names WordPress, with the implication as evidence', () => {
  const r = run(pages.betterDocsAlone);
  assert.equal(r.platform.id, 'betterdocs');
  assert.ok(byId(r, 'wordpress').evidence.includes('implied by BetterDocs'));
});

for (const [id, slug] of [['heroic-kb', 'ht-knowledge-base'], ['wedocs', 'wedocs'], ['echo-kb', 'echo-knowledge-base']]) {
  test(`${id}: plugin asset paths give a KB row and imply WordPress`, () => {
    const r = run(pages.pluginPage(slug));
    assert.equal(r.platform.id, id);
    assert.equal(r.platform.confidence, 'high');
    assert.ok(byId(r, 'wordpress').evidence.some((e) => e.startsWith('implied by')));
  });
}

test('MediaWiki: KB row', () => {
  const r = run(pages.mediaWiki);
  assert.equal(r.verdict.state, 'kb');
  assert.equal(r.verdict.headline, 'MediaWiki');
  assert.equal(r.verdict.confidence, 'high');
});

for (const [id, html] of Object.entries(pages.wikiEnginePages)) {
  test(`${id}: wiki engine gives a KB row`, () => {
    const r = run({ url: 'https://www.example.org/', html });
    assert.equal(r.platform.id, id);
    assert.equal(r.platform.confidence, 'high');
    assert.equal(r.verdict.state, 'kb');
  });
}

for (const [id, page] of Object.entries(pages.cmsPages)) {
  test(`${id}: CMS row, never the primary platform`, () => {
    const r = run({ url: 'https://www.example.org/', ...page });
    assert.equal(r.platform, null);
    assert.equal(byId(r, id).category, 'cms');
    assert.equal(byId(r, id).confidence, 'high');
    assert.equal(r.verdict.state, 'cms');
  });
}

test('prose and code samples naming platforms trigger no CMS or KB rule', () => {
  const r = run(pages.proseAboutPlatforms);
  assert.deepEqual(r.results.filter((x) => x.category === 'kb' || x.category === 'cms'), []);
});

test('primaryPlatform never returns a CMS', () => {
  const results = match(fx.signal({ url: 'https://x.example/', host: 'x.example', meta: { generator: ['WordPress 6.6'] } }), rules);
  assert.equal(results[0].category, 'cms');
  assert.equal(primaryPlatform(results), null);
});

test('shape: one weak signal is never enough', () => {
  assert.equal(shapeOf('https://kb.example.net/').looksLikeKb, false);
  assert.equal(shapeOf('https://www.example.com/docs/').looksLikeKb, false);
  assert.equal(shapeOf('https://www.example.com/', { types: ['FAQPage'] }).looksLikeKb, false);
  assert.equal(shapeOf('https://www.example.com/', { types: ['HowTo'] }).looksLikeKb, false);
  assert.equal(shapeOf('https://www.example.com/', { types: ['FAQPage', 'HowTo'] }).looksLikeKb, false);
  assert.equal(shapeOf('https://www.example.com/', { versioned: true }).looksLikeKb, false);
  assert.equal(shapeOf('https://www.example.com/', { articles: 50 }).looksLikeKb, false);
  assert.equal(shapeOf('https://www.example.com/', { types: ['Article'], internalPages: 500, search: true }).looksLikeKb, false);
});

test('shape: combinations fire and report their reasons', () => {
  const faq = shapeOf('https://help.example.com/', { types: ['FAQPage'] });
  assert.deepEqual(faq, { looksLikeKb: true, reasons: ['host label "help"', 'FAQPage JSON-LD'] });
  assert.equal(shapeOf('https://www.example.com/docs/intro', { versioned: true }).looksLikeKb, true);
  assert.equal(shapeOf('https://www.example.com/', { articles: 5, search: true }).looksLikeKb, true);
  assert.equal(shapeOf('https://www.example.com/', { articles: 4, search: true }).looksLikeKb, false);
  assert.equal(shapeOf('https://support.example.com/a', { types: ['TechArticle'] }).looksLikeKb, true);
  assert.equal(shapeOf('https://docs.example.com/', { internalPages: 20 }).looksLikeKb, true);
  assert.equal(shapeOf('https://docs.example.com/', { internalPages: 19 }).looksLikeKb, false);
});

test('shape: many internal pages only count on a KB-style host, not a path', () => {
  assert.equal(shapeOf('https://www.example.com/support', { internalPages: 90 }).looksLikeKb, false);
});

test('shape: the registrable domain and TLD are not KB hosts', () => {
  for (const url of ['https://docs.example/', 'https://example.help/', 'https://example.wiki/', 'https://www.example.support/']) {
    assert.deepEqual(shapeOf(url, { internalPages: 50 }).reasons, [], url);
  }
});

test('shape: only the leading path segment counts, after an optional locale', () => {
  assert.deepEqual(shapeOf('https://www.example.com/en-us/help/').reasons, ['path segment "help"']);
  assert.deepEqual(shapeOf('https://www.example.com/category/support/').reasons, []);
  assert.deepEqual(shapeOf('https://www.example.com/blog/help/').reasons, []);
  assert.deepEqual(shapeOf('https://www.example.com/helpful-tips/').reasons, []);
});

test('shape: a bad URL is simply not a KB', () => {
  assert.deepEqual(shapeOf('not a url', { types: ['FAQPage'] }), { looksLikeKb: false, reasons: [] });
});
