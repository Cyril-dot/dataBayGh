import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { BUNDLE_SIZES } from '../data/bundleCatalog';

/**
 * Drives every bundle-price display in the app.
 *
 * There is no invented/indicative pricing. Every number shown comes from
 * a real backend pricing table:
 *
 *  - Guest (not logged in)
 *      -> GET /api/v1/pricing/public
 *         Admin's public price table. No auth required.
 *
 *  - Logged in, no referring reseller (includes admin-direct users)
 *      -> GET /api/v1/pricing/effective
 *         Resolves to admin's public price.
 *
 *  - Logged in, referred by a reseller
 *      -> GET /api/v1/pricing/effective
 *         Resolves to that reseller's custom price for any bundle they've
 *         priced, falling back to admin's public price bundle-by-bundle
 *         for anything the reseller hasn't set.
 *
 * The last two cases hit the SAME endpoint — the backend does the
 * reseller-vs-admin resolution from the caller's own account
 * (User.referredByReseller), so the frontend never needs to know or care
 * which bucket the logged-in user falls into. Only "guest vs logged in"
 * decides which endpoint we call.
 *
 * status:
 *  - 'loading' -> fetching the applicable pricing table
 *  - 'ready'   -> rows populated, priceFor() returns real prices
 *  - 'error'   -> the fetch failed; caller should show a retry state,
 *                 same pattern as the admin "Could not reach Big Dreams"
 *                 panel. Never silently substitute a guessed price here.
 *
 * Visibility:
 *  BUNDLE_SIZES (from bundleCatalog) is just the universe of sizes the
 *  UI knows how to render as tabs/cards. It is NOT the set of sizes to
 *  show — a size only belongs on screen if the resolved pricing table
 *  actually has a row for it. `sizesFor(network)` does that filtering;
 *  pages should use it (or `availableSizes`, keyed by network) instead
 *  of reading BUNDLE_SIZES directly, so an unpriced bundle never shows
 *  up as a blank/zero card.
 */
export function usePricingCatalog() {
  const { isAuthenticated } = useAuth();
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState('loading');

  const load = useCallback(() => {
    let active = true;
    setStatus('loading');

    const request = isAuthenticated ? api.pricing.getEffective() : api.pricing.getPublic();

    request
      .then((data) => {
        if (!active) return;
        setRows(data);
        setStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setRows(null);
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  useEffect(() => load(), [load]);

  const priceFor = (network, capacityGb) => {
    if (status !== 'ready' || !rows) return null;
    const row = rows.find(
      (r) => r.network === network && Number(r.capacityGb) === Number(capacityGb)
    );
    return row ? row.publicPriceGhc : null;
  };

  // Which BUNDLE_SIZES actually have a priced row for a given network.
  // Falls back to [] (not the full list) while loading/erroring, so
  // callers never render a card they can't put a real price on.
  const sizesFor = useCallback(
    (network) => {
      if (status !== 'ready' || !rows) return [];
      const priced = new Set(
        rows.filter((r) => r.network === network).map((r) => Number(r.capacityGb))
      );
      return BUNDLE_SIZES.filter((size) => priced.has(Number(size)));
    },
    [rows, status]
  );

  // Same thing, precomputed for every network present in rows, in case
  // a page wants to render all networks without calling sizesFor per tab.
  const availableSizes = useMemo(() => {
    if (status !== 'ready' || !rows) return {};
    return rows.reduce((acc, r) => {
      const net = r.network;
      if (!acc[net]) acc[net] = new Set();
      acc[net].add(Number(r.capacityGb));
      return acc;
    }, {});
  }, [rows, status]);

  return {
    priceFor,
    sizesFor,
    availableSizes,
    status,
    retry: load,
    sizes: BUNDLE_SIZES,
  };
}

export default usePricingCatalog;