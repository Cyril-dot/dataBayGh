/**
 * Real Ghana flag image (flagcdn.com), used everywhere the old 🇬🇭 emoji
 * used to sit — brand mark, favicon-adjacent badges, footer, etc.
 */
export default function GhanaFlag({ size = 22, rounded = true, className = '' }) {
  return (
    <img
      src={`https://flagcdn.com/w80/gh.png`}
      srcSet={`https://flagcdn.com/w80/gh.png 1x, https://flagcdn.com/w160/gh.png 2x`}
      width={size}
      alt="Ghana flag"
      loading="lazy"
      className={`ghana-flag ${rounded ? 'ghana-flag--rounded' : ''} ${className}`}
    />
  );
}
