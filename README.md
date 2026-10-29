# Seattle Restaurant Week 2026 — signature menus and Pareto comparisons

A static research website covering 275 Seattle Restaurant Week listings and 621 offer variants for the October 18–31, 2026 event.

## Website

https://thapecroth.github.io/seattle-restaurant-week-2026/

The site includes location, cuisine and meal filters; menu breakdowns; independent dish-specific evidence; missing-signature disclosures; and a filter-aware Pareto chart.

Signature fidelity is not a food-quality rating. Unknown evidence stays unknown. The price frontier uses interpretable published minimum per-person prices and disclosed mandatory fees, not a guaranteed checkout total. Consult the on-page methodology and original restaurant sources before booking.

## Hosting

GitHub Pages serves the root of the `main` branch. All assets and data are static; filtering and comparisons run in the browser. No backend server, API key or build step is required.

## Files

- `index.html` — report and full restaurant directory
- `signature-client.js` — interactive presentation
- `frontier-engine.js` — eligibility, normalization and Pareto calculations
- `guide.css` — responsive editorial styling and compact offer cards
- `guide.js` — accessible disclosure and deep-link navigation
- `signature-data.json` — evidence metadata and offer audit snapshot
- `signature-offers.csv` — offer-level export
- `menus.csv` — original restaurant-level menu export
- `discount.html`, `discount.css`, `discount-client.js` — Maximum Savings companion view
- `discount-engine.js` — original-price basket, discount and evidence calculations
- `discount-data.json`, `discount-offers.csv` — full-census original-price audit, including unresolved comparisons
- `offer-groups.js` — display-only deduplication; original meal-specific records remain intact

The savings view distinguishes fully verified comparisons from named-item estimates, uses a cheaper identical regular combo when established, and does not accept event-flyer “regular value” claims as independently checked ordinary-menu prices. Unknown portions, original prices or serving bases remain explicit.

This is a research snapshot, not a live menu or reservation service. The linked sources and on-page qualifications take precedence over abbreviated summaries. Published evidence consists of summaries and links to original sources.
