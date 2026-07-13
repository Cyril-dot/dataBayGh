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
 *
 * IMPORTANT — this hook is BUYER-facing only. priceFor()/getEffective()
 * answer "what does the caller pay?" and fall back to the admin's PUBLIC
 * price. A reseller's own wholesale COST is a different number (it falls
 * back to the admin's WHOLESALE reseller price instead) — use
 * useResellerCostCatalog below for that. Do not use this hook to show a
 * reseller their cost price; for a reseller with no referring reseller of
 * their own, priceFor() here will silently return the wrong (public,
 * not wholesale) number.
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

/**
 * Reseller-only companion to usePricingCatalog: drives the reseller's OWN
 * pricing-management page (e.g. "My selling prices") — where a reseller
 * needs to see (a) their wholesale cost floor and (b) what's currently
 * live for buyers they refer, side by side, while they edit their own
 * selling price.
 *
 *  - GET /api/v1/pricing/reseller/cost
 *      -> costFor(network, capacityGb): this reseller's wholesale cost —
 *         the floor their own selling price must sit above. Falls back to
 *         the admin's WHOLESALE reseller price (not the public price), or
 *         to the upstream reseller's price if this reseller was itself
 *         referred. THIS is the correct endpoint for "what do I pay?" —
 *         not /pricing/effective (see warning on usePricingCatalog above).
 *
 *  - GET /api/v1/pricing/reseller/effective
 *      -> effectiveFor(network, capacityGb): what a buyer referred by
 *         this reseller currently pays — this reseller's own
 *         ResellerPricing row where set, admin public price as fallback
 *         otherwise. row.isCustomPrice tells you which branch was used.
 *
 * The two tables are fetched and exposed independently (separate status
 * flags) rather than merged, since a page may want to treat "couldn't
 * load my live price" as non-blocking/supplementary while still treating
 * "couldn't load my cost" as a hard error — that's a per-page call, not
 * something this hook should decide for you.
 */
export function useResellerCostCatalog() {
  const [costRows, setCostRows] = useState(null);
  const [costStatus, setCostStatus] = useState('loading');

  const [effectiveRows, setEffectiveRows] = useState(null);
  const [effectiveStatus, setEffectiveStatus] = useState('loading');

  const loadCost = useCallback(() => {
    let active = true;
    setCostStatus('loading');

    api.pricing
      .getResellerCost()
      .then((data) => {
        if (!active) return;
        setCostRows(data);
        setCostStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setCostRows(null);
        setCostStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  const loadEffective = useCallback(() => {
    let active = true;
    setEffectiveStatus('loading');

    api.pricing
      .getResellerEffective()
      .then((data) => {
        if (!active) return;
        setEffectiveRows(data);
        setEffectiveStatus('ready');
      })
      .catch(() => {
        if (!active) return;
        setEffectiveRows(null);
        setEffectiveStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => loadCost(), [loadCost]);
  useEffect(() => loadEffective(), [loadEffective]);

  const costFor = useCallback(
    (network, capacityGb) => {
      if (costStatus !== 'ready' || !costRows) return null;
      const row = costRows.find(
        (r) => r.network === network && Number(r.capacityGb) === Number(capacityGb)
      );
      return row ? row.publicPriceGhc : null;
    },
    [costRows, costStatus]
  );

  const effectiveFor = useCallback(
    (network, capacityGb) => {
      if (effectiveStatus !== 'ready' || !effectiveRows) return null;
      return (
        effectiveRows.find(
          (r) => r.network === network && Number(r.capacityGb) === Number(capacityGb)
        ) || null
      );
    },
    [effectiveRows, effectiveStatus]
  );

  // Which BUNDLE_SIZES have a cost row for a given network — mirrors
  // usePricingCatalog.sizesFor.
  const sizesFor = useCallback(
    (network) => {
      if (costStatus !== 'ready' || !costRows) return [];
      const priced = new Set(
        costRows.filter((r) => r.network === network).map((r) => Number(r.capacityGb))
      );
      return BUNDLE_SIZES.filter((size) => priced.has(Number(size)));
    },
    [costRows, costStatus]
  );

  return {
    costFor,
    costStatus,
    retryCost: loadCost,
    effectiveFor,
    effectiveStatus,
    retryEffective: loadEffective,
    sizesFor,
    sizes: BUNDLE_SIZES,
  };
}

/**
 * Standalone, slug-based buyer-facing pricing preview — for pages that
 * need to look up a SPECIFIC reseller's live pricing table by their
 * storeSlug (e.g. an admin "preview this reseller's storefront prices"
 * screen), without going through PublicStorefront.jsx and without
 * needing the reseller's userId.
 *
 * NOT used by PublicStorefront.jsx — that page gets its bundle list
 * (with sellingPriceGhc already resolved) from
 * api.storefront.getStore(slug) instead, which also carries store
 * branding (name, tagline, logo, theme) alongside the bundles. Reach for
 * this hook only when you need JUST the pricing rows for a slug, with no
 * storefront chrome attached.
 */
export function usePricingByStoreSlug(storeSlug) {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState('loading');

  const load = useCallback(() => {
    if (!storeSlug) {
      setRows(null);
      setStatus('error');
      return () => {};
    }

    let active = true;
    setStatus('loading');

    api.pricing
      .getByStoreSlug(storeSlug)
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
  }, [storeSlug]);

  useEffect(() => load(), [load]);

  const priceFor = useCallback(
    (network, capacityGb) => {
      if (status !== 'ready' || !rows) return null;
      const row = rows.find(
        (r) => r.network === network && Number(r.capacityGb) === Number(capacityGb)
      );
      return row ? row.publicPriceGhc : null;
    },
    [rows, status]
  );

  return { rows, priceFor, status, retry: load };
}

export default usePricingCatalog;