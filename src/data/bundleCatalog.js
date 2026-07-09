/**
 * Just the list of bundle sizes the buy page renders as tabs/cards.
 *
 * There is no fallback pricing here anymore. Every price shown to a user
 * must come from the backend's real pricing table (admin's public price,
 * or a reseller's override where one exists) via
 * /api/v1/pricing/effective — see src/hooks/usePricingCatalog.js.
 *
 * Previously this file also computed a made-up "indicative" price from a
 * flat formula. That number had no relationship to what was actually
 * configured in Admin > Platform pricing, and it would silently replace
 * the real price any time the effective-pricing request failed — which
 * is exactly the GH₵7.00-vs-GH₵6.00 bug this file used to cause. Don't
 * reintroduce a fallback formula; if pricing can't be fetched, the UI
 * should say so, not guess.
 */

export const BUNDLE_SIZES = [1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 25, 30, 40, 50];