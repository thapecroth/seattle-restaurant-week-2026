/* Pure, independently testable offer normalization and Pareto logic. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SRWFrontier = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const finite = x => typeof x === 'number' && Number.isFinite(x);
  const unique = xs => [...new Set(xs)];
  function normalizeOffer(restaurant, offer, partySize = 2) {
    const sources = new Map((restaurant.sources || []).map(s => [s.id, s]));
    const validSource = id => {
      const s = sources.get(id);
      return !!s && ['independent_review','independent_guide'].includes(s.kind)
        && s.read_extent === 'full' && s.exact_branch === true;
    };
    const matches = (offer.matches || []).filter(m =>
      ['exact','modified'].includes(m.match_type) && (m.source_ids || []).some(validSource));
    const signatureCount = unique(matches.filter(m => m.match_type === 'exact').map(m => String(m.signature_dish).trim().toLowerCase())).length;
    const exactCount = matches.filter(m => m.match_type === 'exact').length;
    const priceKnown = finite(offer.package_price) && offer.package_price >= 0
      && finite(offer.serves) && offer.serves > 0;
    const pct = finite(offer.mandatory_fee_pct) ? offer.mandatory_fee_pct : 0;
    const fixed = finite(offer.mandatory_fixed_fee) ? offer.mandatory_fixed_fee : 0;
    const cost = priceKnown ? Math.round((offer.package_price * (1 + pct / 100) + fixed) / offer.serves * 100) / 100 : null;
    const hasIndependentEvidence = [...sources.keys()].some(validSource);
    const fit = hasIndependentEvidence && finite(offer.signature_fit) && offer.signature_fit >= 0 && offer.signature_fit <= 4 ? offer.signature_fit : null;
    const minimumParty = finite(offer.min_party) ? offer.min_party : (finite(offer.serves) ? offer.serves : 1);
    const eventValid = offer.event_valid === true;
    const isMeal = offer.experience_type === 'meal';
    const signatureQualified = fit !== null && fit >= 3 && exactCount > 0 && signatureCount > 0
      && eventValid && isMeal && offer.confidence !== 'unverified' && offer.needs_supplement !== true;
    const eligible = signatureQualified && priceKnown && minimumParty <= partySize && offer.fee_status !== 'ambiguous';
    const exclusionReasons = [];
    if (!priceKnown) exclusionReasons.push('Price or number served is unresolved');
    if (fit === null || !exactCount) exclusionReasons.push('No independently verified included core signature');
    else if (fit < 3) exclusionReasons.push('Only modified/style overlap, or core dishes missing');
    if (minimumParty > partySize) exclusionReasons.push(`Requires at least ${minimumParty} diners`);
    if (!eventValid) exclusionReasons.push('Offer ended, wrong season or not currently applicable');
    if (!isMeal) exclusionReasons.push('Not an established complete meal; desserts, drinks and snack-only sets are not meal competitors');
    if (offer.needs_supplement === true) exclusionReasons.push('Signature requires a paid supplement; the base offer is not scored as if it includes that dish');
    if (offer.fee_status === 'ambiguous') exclusionReasons.push('Compulsory fee treatment is ambiguous');
    return {...offer, restaurant, key: `${restaurant.id}:${offer.offer_id}`, cost_pp:cost,
      signature_fit:fit, signature_count:signatureCount, evidenced_matches:matches,
      eligible, signature_qualified:signatureQualified, exclusion_reasons:exclusionReasons,
      fee_warning: offer.fee_status !== 'verified' ? 'Other mandatory fees not established; plotted cost is a published lower bound' : ''};
  }
  function dominates(a,b) {
    if (!a.eligible || !b.eligible || !finite(a.cost_pp) || !finite(b.cost_pp)) return false;
    return a.cost_pp <= b.cost_pp && a.signature_fit >= b.signature_fit && a.signature_count >= b.signature_count
      && (a.cost_pp < b.cost_pp || a.signature_fit > b.signature_fit || a.signature_count > b.signature_count);
  }
  function pareto(offers) {
    const eligible = offers.filter(o => o.eligible);
    return eligible.filter(o => !eligible.some(other => other !== o && dominates(other,o)));
  }
  function rank(offers) {
    const confidence = {high:3,medium:2,low:1,unverified:0};
    return [...offers].sort((a,b) => Number(b.signature_qualified)-Number(a.signature_qualified)
      || (b.signature_fit ?? -1)-(a.signature_fit ?? -1)
      || b.signature_count-a.signature_count
      || (confidence[b.confidence]||0)-(confidence[a.confidence]||0)
      || Number(b.eligible)-Number(a.eligible)
      || (a.cost_pp ?? Infinity)-(b.cost_pp ?? Infinity)
      || a.restaurant.name.localeCompare(b.restaurant.name));
  }
  function filterOffers(offers, filters = {}) {
    const q = String(filters.q || '').trim().toLowerCase();
    return offers.filter(o => (!filters.city || o.restaurant.city === filters.city)
      && (!filters.cuisine || (o.restaurant.cuisines || []).includes(filters.cuisine))
      && (!filters.meal || o.meal === filters.meal || o.meal === 'any')
      && (!q || [o.restaurant.name,o.restaurant.city,...(o.restaurant.cuisines||[]),o.label,o.verdict,
        ...(o.included_dishes||[]),...(o.missing_signatures||[]),...(o.matches||[]).map(m=>m.signature_dish)]
        .join(' ').toLowerCase().includes(q)));
  }
  return {normalizeOffer, dominates, pareto, rank, filterOffers};
});
