// src/utils/phoneNetwork.js
/**
 * Ghana mobile network prefix table + helpers for validating that a phone
 * number actually belongs to the network the user selected.
 *
 * Prefixes (post MTN / Telecel / AT rebrands):
 *   MTN      -> 024, 025, 053, 054, 055, 059
 *   Telecel  -> 020, 050            (formerly Vodafone)
 *   AT       -> 026, 027, 056, 057  (formerly AirtelTigo)
 */

export const NETWORK_PREFIXES = {
  MTN: ['024', '025', '053', '054', '055', '059'],
  TELECEL: ['020', '050'],
  AT: ['026', '027', '056', '057'],
};

// Normalizes whatever casing/spelling a network value might arrive in
// (bundle catalog rows, badges, legacy data, user selection, etc.) down
// to one of the NETWORK_PREFIXES keys above.
const ALIASES = {
  MTN: 'MTN',
  AT: 'AT',
  AIRTELTIGO: 'AT',
  'AIRTEL-TIGO': 'AT',
  AIRTEL_TIGO: 'AT',
  TELECEL: 'TELECEL',
  VODAFONE: 'TELECEL',
};

export function normalizeNetwork(network) {
  if (!network) return null;
  const key = String(network).trim().toUpperCase().replace(/\s+/g, '');
  return ALIASES[key] || null;
}

// Returns the normalized network key ('MTN' | 'TELECEL' | 'AT') that owns
// this prefix, or null if the number is too short / prefix isn't recognized.
export function detectNetworkFromPhone(phoneNumber) {
  if (!phoneNumber) return null;
  const digits = String(phoneNumber).replace(/\D/g, '');
  if (digits.length < 3) return null;
  const prefix = digits.slice(0, 3);
  for (const [network, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix)) return network;
  }
  return null;
}

/**
 * Checks whether `phoneNumber`'s prefix belongs to `selectedNetwork`.
 *
 * Returns:
 *  - { mismatch: false, detectedNetwork }  number matches, too short to
 *                                           tell yet, or prefix unrecognized
 *  - { mismatch: true, detectedNetwork }   number clearly belongs to a
 *                                           different network than selected
 */
export function checkNetworkMatch(selectedNetwork, phoneNumber) {
  const detected = detectNetworkFromPhone(phoneNumber);
  if (!detected) return { mismatch: false, detectedNetwork: null };

  const normalizedSelected = normalizeNetwork(selectedNetwork);
  if (!normalizedSelected) return { mismatch: false, detectedNetwork: detected };

  return {
    mismatch: detected !== normalizedSelected,
    detectedNetwork: detected,
  };
}

export function networkLabel(network) {
  switch (normalizeNetwork(network)) {
    case 'MTN':
      return 'MTN';
    case 'TELECEL':
      return 'Telecel';
    case 'AT':
      return 'AT (AirtelTigo)';
    default:
      return network;
  }
}