import { primaryPlatform } from './matcher.js';

const EVIDENCE_PRIORITY = ['cname', 'headers', 'meta', 'jsGlobals', 'scriptSrc'];

const KB_LABEL = 'Knowledge base platform';
const SITE_LABEL = 'Site platform';

export function bestEvidence(result) {
  for (const type of EVIDENCE_PRIORITY) {
    const hit = result.evidence.find((e) => e.startsWith(type + ':'));
    if (hit) return hit;
  }
  return result.evidence[0];
}

// The base CMS reads first: WordPress + Elementor, whichever scored higher.
function cmsHeadline(cms) {
  const ids = new Set(cms.map((r) => r.id));
  const isBase = (r) => (r.impliedBy || []).some((id) => ids.has(id));
  return [...cms.filter(isBase), ...cms.filter((r) => !isBase(r))].map((r) => r.name).join(' + ');
}

export function platformVerdict(results, shape) {
  const looksLikeKb = !!shape?.looksLikeKb;

  const platform = primaryPlatform(results);
  if (platform) {
    const onlyGeneralPurpose = results.every((r) => r.category !== 'kb' || r.score <= 0 || r.generalPurpose);
    const doubtful = onlyGeneralPurpose && !looksLikeKb;
    return {
      state: doubtful ? 'kb-general-purpose' : 'kb',
      label: KB_LABEL,
      headline: platform.name,
      confidence: platform.confidence,
      supporting: doubtful ? 'May not be a knowledge base.' : bestEvidence(platform),
      noRule: false,
    };
  }

  const cms = results.filter((r) => r.category === 'cms');
  if (cms.length) {
    return {
      state: 'cms',
      label: SITE_LABEL,
      headline: cmsHeadline(cms),
      confidence: null,
      supporting: 'General-purpose CMS. No KB plugin detected.',
      noRule: false,
    };
  }

  return looksLikeKb
    ? { state: 'unknown-kb', label: KB_LABEL, headline: 'Unknown platform', confidence: null, supporting: 'Looks like a knowledge base. Raw clues below.', noRule: true }
    : { state: 'no-kb', label: KB_LABEL, headline: 'No knowledge base detected', confidence: null, supporting: 'No rule matched on this page. Raw clues below.', noRule: true };
}
