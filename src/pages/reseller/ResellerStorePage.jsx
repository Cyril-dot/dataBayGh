import { useEffect, useRef, useState, useCallback } from 'react';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import Spinner from '../../components/Spinner';
import Icon from '../../components/Icon';
import ShareFlyout from '../../components/ShareFlyout';

// ─── Constants ────────────────────────────────────────────────────────────────

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const IMGBB_KEY = import.meta.env.VITE_IMGBB_API_KEY ?? 'bdd12743a2e929bcdd4a6843dea9295e';

const PRESETS = [
  { hex: '#2C7BE5', label: 'Ocean' },
  { hex: '#10B981', label: 'Emerald' },
  { hex: '#F59E0B', label: 'Amber' },
  { hex: '#EF4444', label: 'Red' },
  { hex: '#8B5CF6', label: 'Violet' },
  { hex: '#EC4899', label: 'Pink' },
  { hex: '#14B8A6', label: 'Teal' },
  { hex: '#F97316', label: 'Orange' },
];

const SECTIONS = [
  { id: 'identity', label: 'Identity',  icon: 'store',   tag: '01' },
  { id: 'branding', label: 'Branding',  icon: 'palette', tag: '02' },
  { id: 'media',    label: 'Media',     icon: 'image',   tag: '03' },
  { id: 'social',   label: 'Social',    icon: 'share',   tag: '04' },
];

const DUMMY_BUNDLES = [
  { network: 'MTN',     gb: '1 GB',  price: 'GHS 4.50' },
  { network: 'Telecel', gb: '3 GB',  price: 'GHS 12.00' },
  { network: 'MTN',     gb: '5 GB',  price: 'GHS 18.00' },
];

// ─── Image upload to imgbb ────────────────────────────────────────────────────

async function uploadToImgbb(file) {
  if (!IMGBB_KEY) {
    throw new Error('No VITE_IMGBB_API_KEY set — add it to your .env file.');
  }
  const b64 = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const body = new FormData();
  body.append('image', b64);
  body.append('name', file.name.replace(/\.[^.]+$/, ''));
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
    method: 'POST',
    body,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message ?? 'Upload failed');
  return json.data.url;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ImageUploadField({ id, label, hint, value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [previewErr, setPreviewErr] = useState(false);

  useEffect(() => { setPreviewErr(false); }, [value]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadErr('Select an image file (JPG, PNG, GIF, WebP…)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadErr('File must be under 10 MB');
      return;
    }
    setUploadErr('');
    setUploading(true);
    try {
      const url = await uploadToImgbb(file);
      onChange(url);
    } catch (err) {
      setUploadErr(err.message ?? 'Upload failed — try again');
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div className="rs-upload-field">
      <label htmlFor={id} className="rs-field-label">
        {label}
        {hint && <span className="rs-field-hint">{hint}</span>}
      </label>

      <div
        className={`rs-dropzone${uploading ? ' rs-dropzone--uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label} — click or drop a file`}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !uploading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/*"
          aria-label={`Choose ${label} image file`}
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {uploading ? (
          <span className="rs-dropzone__status">
            <span className="rs-spinner" aria-hidden="true" />
            Uploading…
          </span>
        ) : value ? (
          <span className="rs-dropzone__status rs-dropzone__status--replace">
            <Icon name="upload" size={14} aria-hidden="true" />
            Replace image
          </span>
        ) : (
          <span className="rs-dropzone__status">
            <Icon name="upload" size={14} aria-hidden="true" />
            Click to upload or drag &amp; drop
          </span>
        )}
      </div>

      {value && !previewErr && (
        <div className="rs-upload-preview" aria-live="polite">
          <img
            src={value}
            alt={`${label} preview`}
            width="320"
            height="80"
            loading="lazy"
            onError={() => setPreviewErr(true)}
          />
          <button
            type="button"
            className="rs-upload-preview__remove"
            aria-label={`Remove ${label}`}
            onClick={() => { onChange(''); setUploadErr(''); }}
          >
            <Icon name="close" size={13} aria-hidden="true" />
          </button>
        </div>
      )}
      {previewErr && value && (
        <p className="rs-field-error" role="alert">
          <Icon name="broken_image" size={13} aria-hidden="true" /> Could not load — the URL may be invalid
        </p>
      )}
      {uploadErr && <p className="rs-field-error" role="alert">{uploadErr}</p>}
    </div>
  );
}

function PillToggle({ name, options, value, onChange }) {
  return (
    <div className="rs-pill-group" role="group" aria-label={name}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            className={`rs-pill${active ? ' rs-pill--active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            <span aria-hidden="true">{opt.icon}</span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function LogoFallback({ name, colour }) {
  const initials = (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <div
      aria-hidden="true"
      style={{
        width: '100%', height: '100%',
        background: colour,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800, fontSize: '1.1rem',
      }}
    >
      {initials}
    </div>
  );
}

// Decorative perforated-edge divider used between the voucher header and
// the bundle list — drawn with currentColor so it always matches --border.
function PerforatedEdge() {
  return (
    <svg className="rs-voucher__perf" viewBox="0 0 300 10" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1="5" x2="300" y2="5" stroke="currentColor" strokeWidth="1" strokeDasharray="1 6" />
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResellerStorePage() {
  const notify = useNotify();

  const [settings,      setSettings]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [busy,          setBusy]          = useState(false);
  const [dirty,         setDirty]         = useState(false);
  const [activeSection, setActiveSection] = useState('identity');
  const [colourErr,     setColourErr]     = useState('');

  const [shareInfo,    setShareInfo]    = useState(null);
  const [flyoutOpen,   setFlyoutOpen]   = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const [form, setForm] = useState({
    storeName:       '',
    storeTagline:    '',
    welcomeMessage:  '',
    themeColour:     '#2C7BE5',
    storeTheme:      'LIGHT',
    buttonStyle:     'ROUNDED',
    storeLogoUrl:    '',
    bannerImageUrl:  '',
    whatsappNumber:  '',
    instagramHandle: '',
  });

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  useEffect(() => {
    setLoading(true);
    api.reseller
      .getStoreSettings()
      .then((data) => {
        setSettings(data);
        setForm({
          storeName:       data.storeName       ?? '',
          storeTagline:    data.storeTagline     ?? '',
          welcomeMessage:  data.welcomeMessage   ?? '',
          themeColour:     data.themeColour      ?? '#2C7BE5',
          storeTheme:      data.storeTheme       ?? 'LIGHT',
          buttonStyle:     data.buttonStyle      ?? 'ROUNDED',
          storeLogoUrl:    data.storeLogoUrl     ?? '',
          bannerImageUrl:  data.bannerImageUrl   ?? '',
          whatsappNumber:  data.whatsappNumber   ?? '',
          instagramHandle: data.instagramHandle  ?? '',
        });
      })
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load store settings.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = useCallback((key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
    if (key === 'themeColour') setColourErr('');
  }, []);

  const update = useCallback((key) => (e) => patch(key, e.target.value), [patch]);

  const openShare = async () => {
    if (shareInfo) { setFlyoutOpen(true); return; }
    setShareLoading(true);
    try {
      const data = await api.reseller.getShareInfo();
      setShareInfo(data);
      setFlyoutOpen(true);
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not load share info.'));
    } finally {
      setShareLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.themeColour && !HEX_RE.test(form.themeColour)) {
      setColourErr('Enter a valid 6-digit hex colour, e.g. #1A73E8');
      setActiveSection('branding');
      return;
    }
    setBusy(true);
    try {
      const updated = await api.reseller.updateStoreSettings({
        storeName:       form.storeName       || null,
        storeTagline:    form.storeTagline     || null,
        welcomeMessage:  form.welcomeMessage   || null,
        themeColour:     form.themeColour      || null,
        storeTheme:      form.storeTheme,
        buttonStyle:     form.buttonStyle,
        storeLogoUrl:    form.storeLogoUrl     || null,
        bannerImageUrl:  form.bannerImageUrl   || null,
        whatsappNumber:  form.whatsappNumber   || null,
        instagramHandle: form.instagramHandle  || null,
      });
      setSettings(updated);
      setDirty(false);
      notify.success('Store saved.');
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not save store settings.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading store settings…" />;

  // ── Derived preview values ──────────────────────────────────────────────────
  const accent      = HEX_RE.test(form.themeColour) ? form.themeColour : '#2C7BE5';
  const isDark      = form.storeTheme === 'DARK';
  const isRounded   = form.buttonStyle === 'ROUNDED';
  const displayName = form.storeName || settings?.storeName || 'Your Store';

  const storeUrl =
    shareInfo?.storeUrl ??
    (settings?.storeSlug
      ? `${window.location.origin}/store/${settings.storeSlug}`
      : null);

  const pv = {
    bg:      isDark ? '#18181b' : '#ffffff',
    text:    isDark ? '#f4f4f5' : '#18181b',
    muted:   isDark ? '#a1a1aa' : '#71717a',
    border:  isDark ? '#3f3f46' : '#e4e4e7',
    surface: isDark ? '#27272a' : '#f4f4f5',
    btnR:    isRounded ? '999px' : '5px',
  };

  // ── Section content ─────────────────────────────────────────────────────────
  const sectionContent = {
    identity: (
      <fieldset className="rs-fieldset">
        <legend className="rs-legend">Store identity</legend>

        <div className="rs-field">
          <label htmlFor="storeName" className="rs-field-label">Store name</label>
          <input
            id="storeName"
            name="storeName"
            value={form.storeName}
            onChange={update('storeName')}
            placeholder="e.g. Kwame's Data Bundles…"
            maxLength={200}
            autoComplete="organization"
            spellCheck={false}
          />
        </div>

        <div className="rs-field">
          <label htmlFor="storeTagline" className="rs-field-label">Tagline</label>
          <input
            id="storeTagline"
            name="storeTagline"
            value={form.storeTagline}
            onChange={update('storeTagline')}
            placeholder="e.g. Fast data — MTN, Telecel, AirtelTigo…"
            maxLength={300}
            autoComplete="off"
          />
        </div>

        <div className="rs-field">
          <label htmlFor="welcomeMessage" className="rs-field-label">
            Welcome message
            <span className="rs-field-hint">Shown below your store name</span>
          </label>
          <textarea
            id="welcomeMessage"
            name="welcomeMessage"
            value={form.welcomeMessage}
            onChange={update('welcomeMessage')}
            placeholder="Tell customers who you are and why they should buy from you…"
            rows={4}
            autoComplete="off"
            style={{ resize: 'vertical' }}
          />
          <p className="rs-field-count" aria-live="polite">
            {form.welcomeMessage.length} / 1000
          </p>
        </div>
      </fieldset>
    ),

    branding: (
      <fieldset className="rs-fieldset">
        <legend className="rs-legend">Branding</legend>

        <div className="rs-field">
          <span id="colour-label" className="rs-field-label">Accent colour</span>
          <div className="rs-preset-grid" role="group" aria-labelledby="colour-label">
            {PRESETS.map(({ hex, label }) => (
              <button
                key={hex}
                type="button"
                className={`rs-swatch${form.themeColour === hex ? ' rs-swatch--active' : ''}`}
                style={{ background: hex }}
                aria-label={`${label} (${hex})`}
                aria-pressed={form.themeColour === hex}
                onClick={() => patch('themeColour', hex)}
              />
            ))}
          </div>
          <div className="rs-hex-row">
            <div
              className="rs-hex-chip"
              style={{ background: HEX_RE.test(form.themeColour) ? form.themeColour : 'var(--border)' }}
              aria-hidden="true"
            />
            <div style={{ flex: 1 }}>
              <label htmlFor="themeColour" className="rs-field-label" style={{ marginBottom: 4 }}>
                Custom hex
              </label>
              <input
                id="themeColour"
                name="themeColour"
                value={form.themeColour}
                onChange={update('themeColour')}
                placeholder="#2C7BE5"
                maxLength={7}
                autoComplete="off"
                spellCheck={false}
                aria-describedby={colourErr ? 'colour-err' : undefined}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '.85rem' }}
              />
              {colourErr && (
                <p id="colour-err" className="rs-field-error" role="alert">{colourErr}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rs-field">
          <span id="theme-label" className="rs-field-label">Colour scheme</span>
          <PillToggle
            name="Colour scheme"
            value={form.storeTheme}
            onChange={(v) => patch('storeTheme', v)}
            options={[
              { value: 'LIGHT', label: 'Light', icon: '☀' },
              { value: 'DARK',  label: 'Dark',  icon: '🌙' },
            ]}
          />
        </div>

        <div className="rs-field">
          <span id="btn-label" className="rs-field-label">Button style</span>
          <PillToggle
            name="Button style"
            value={form.buttonStyle}
            onChange={(v) => patch('buttonStyle', v)}
            options={[
              { value: 'ROUNDED', label: 'Rounded', icon: '⬭' },
              { value: 'SQUARE',  label: 'Square',  icon: '⬜' },
            ]}
          />
        </div>
      </fieldset>
    ),

    media: (
      <fieldset className="rs-fieldset">
        <legend className="rs-legend">Media</legend>
        <ImageUploadField
          id="logoUpload"
          label="Logo"
          hint="Square image works best · JPG, PNG, WebP"
          value={form.storeLogoUrl}
          onChange={(url) => patch('storeLogoUrl', url)}
        />
        <ImageUploadField
          id="bannerUpload"
          label="Banner"
          hint="Wide image, 3:1 ratio recommended"
          value={form.bannerImageUrl}
          onChange={(url) => patch('bannerImageUrl', url)}
        />
        {!IMGBB_KEY && (
          <div className="rs-notice" role="note">
            <Icon name="info" size={14} aria-hidden="true" />
            Add <code>VITE_IMGBB_API_KEY</code> to your <code>.env</code> to enable image uploads.
            Get a free key at{' '}
            <a href="https://api.imgbb.com" target="_blank" rel="noopener noreferrer">
              api.imgbb.com <Icon name="open_in_new" size={11} aria-hidden="true" />
            </a>
          </div>
        )}
      </fieldset>
    ),

    social: (
      <fieldset className="rs-fieldset">
        <legend className="rs-legend">Social &amp; contact</legend>

        <div className="rs-field">
          <label htmlFor="whatsappNumber" className="rs-field-label">WhatsApp number</label>
          <input
            id="whatsappNumber"
            name="whatsappNumber"
            type="tel"
            inputMode="tel"
            value={form.whatsappNumber}
            onChange={update('whatsappNumber')}
            placeholder="+233241234567…"
            maxLength={20}
            autoComplete="tel"
            spellCheck={false}
          />
          {form.whatsappNumber && (
            <p className="rs-field-hint rs-field-hint--preview">
              <Icon name="link" size={12} aria-hidden="true" />
              <code>wa.me/{form.whatsappNumber.replace(/[\s\-]/g, '')}</code>
            </p>
          )}
        </div>

        <div className="rs-field">
          <label htmlFor="instagramHandle" className="rs-field-label">
            Instagram handle
            <span className="rs-field-hint">No @ needed</span>
          </label>
          <input
            id="instagramHandle"
            name="instagramHandle"
            value={form.instagramHandle}
            onChange={update('instagramHandle')}
            placeholder="kwamedata…"
            maxLength={60}
            autoComplete="off"
            spellCheck={false}
          />
          {form.instagramHandle && (
            <p className="rs-field-hint rs-field-hint--preview">
              <Icon name="link" size={12} aria-hidden="true" />
              <code>instagram.com/{form.instagramHandle.replace(/^@/, '')}</code>
            </p>
          )}
        </div>
      </fieldset>
    ),
  };

  return (
    <>
      <style>{`
        /* ── Reset / base ────────────────────────────── */
        .rs-page { display: flex; flex-direction: column; gap: 24px; }

        /* ── Page header ─────────────────────────────── */
        .rs-header { display: flex; align-items: flex-start; gap: 16px; }
        .rs-header__text { flex: 1; min-width: 0; }
        .rs-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--accent-bright); font-size: .7rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: .12em;
          font-family: var(--font-mono); margin-bottom: 6px;
        }

        /* ── Three-zone shell ────────────────────────── */
        .rs-shell {
          display: grid;
          grid-template-columns: 176px 1fr 340px;
          grid-template-rows: auto;
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 1080px) {
          .rs-shell { grid-template-columns: 1fr 320px; }
          .rs-nav { display: flex; flex-direction: row; gap: 4px; overflow-x: auto; }
        }
        @media (max-width: 720px) {
          .rs-shell { grid-template-columns: 1fr; }
          .rs-preview-col { display: none; }
        }

        /* ── Section nav — receipt-tab styling, same tokens as before ── */
        .rs-nav {
          display: flex; flex-direction: column; gap: 3px;
          background: var(--surface-raised);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 6px;
        }
        .rs-nav-btn {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 11px; border-radius: 8px; border: none;
          background: transparent; cursor: pointer; text-align: left;
          font-size: .83rem; font-weight: 600; color: var(--text-dim);
          touch-action: manipulation;
          transition: background 150ms, color 150ms;
          -webkit-tap-highlight-color: transparent;
          width: 100%; position: relative;
        }
        .rs-nav-btn__tag {
          font-family: var(--font-mono); font-size: .62rem; font-weight: 700;
          color: var(--text-faint); letter-spacing: .04em;
        }
        .rs-nav-btn:hover { background: var(--surface); color: var(--text); }
        .rs-nav-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .rs-nav-btn--active {
          background: var(--accent-soft); color: var(--accent-bright);
          border: 1px solid var(--accent-border);
        }
        .rs-nav-btn--active .rs-nav-btn__tag { color: var(--accent-bright); }
        .rs-nav-btn--active:hover { background: var(--accent-soft); }
        .rs-nav-dot {
          width: 6px; height: 6px; border-radius: 50%; margin-left: auto;
          background: var(--accent); flex-shrink: 0;
        }

        /* ── Form card ───────────────────────────────── */
        .rs-form-col .card { min-height: 420px; }

        /* ── Fieldset / legend ───────────────────────── */
        .rs-fieldset { border: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 20px; }
        .rs-legend { font-size: 1rem; font-weight: 700; margin-bottom: 4px; padding: 0; }

        /* ── Field atoms ─────────────────────────────── */
        .rs-field { display: flex; flex-direction: column; gap: 6px; }
        .rs-field-label {
          font-size: .74rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: .07em; color: var(--text-dim);
          display: flex; align-items: baseline; gap: 8px;
        }
        .rs-field-hint {
          font-size: .72rem; font-weight: 400; text-transform: none;
          letter-spacing: 0; color: var(--text-faint);
        }
        .rs-field-hint--preview {
          display: flex; align-items: center; gap: 5px;
          font-size: .73rem; color: var(--text-faint);
          font-family: var(--font-mono); margin-top: 2px;
        }
        .rs-field-error {
          font-size: .74rem; color: var(--danger);
          display: flex; align-items: center; gap: 5px;
          margin: 2px 0 0;
        }
        .rs-field-count {
          font-size: .72rem; color: var(--text-faint); text-align: right;
          font-family: var(--font-mono); margin-top: 2px;
        }

        /* ── Colour presets ──────────────────────────── */
        .rs-preset-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
        .rs-swatch {
          width: 28px; height: 28px; border-radius: 7px; cursor: pointer;
          border: 2px solid transparent;
          transition: transform 150ms, border-color 150ms;
          touch-action: manipulation; -webkit-tap-highlight-color: transparent;
        }
        .rs-swatch:hover { transform: scale(1.18); }
        .rs-swatch:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .rs-swatch--active { border-color: #fff; box-shadow: 0 0 0 2px var(--accent); }
        .rs-hex-row { display: flex; gap: 10px; align-items: flex-start; }
        .rs-hex-chip {
          width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
          border: 1px solid var(--border); margin-top: 22px;
        }

        /* ── Pill toggle ─────────────────────────────── */
        .rs-pill-group {
          display: inline-flex; background: var(--surface);
          border: 1px solid var(--border); border-radius: 999px;
          padding: 3px; gap: 2px;
        }
        .rs-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 16px; border-radius: 999px; border: none;
          font-size: .8rem; font-weight: 700; cursor: pointer;
          touch-action: manipulation; -webkit-tap-highlight-color: transparent;
          transition: background 150ms, color 150ms;
          background: transparent; color: var(--text-dim);
        }
        .rs-pill:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .rs-pill--active { background: var(--accent); color: #fff; }
        .rs-pill--active:hover { background: var(--accent); }

        /* ── Image upload field ──────────────────────── */
        .rs-upload-field { display: flex; flex-direction: column; gap: 8px; }
        .rs-dropzone {
          display: flex; align-items: center; justify-content: center;
          padding: 18px; border-radius: 10px; cursor: pointer;
          border: 2px dashed var(--border); background: var(--surface);
          transition: border-color 150ms, background 150ms;
          touch-action: manipulation; -webkit-tap-highlight-color: transparent;
        }
        .rs-dropzone:hover, .rs-dropzone:focus-visible {
          border-color: var(--accent); background: var(--accent-soft);
        }
        .rs-dropzone:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .rs-dropzone--uploading { cursor: default; opacity: .7; }
        .rs-dropzone__status {
          display: flex; align-items: center; gap: 7px;
          font-size: .82rem; color: var(--text-dim); font-weight: 600;
        }
        .rs-dropzone__status--replace { color: var(--accent-bright); }
        .rs-spinner {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid var(--accent-border);
          border-top-color: var(--accent);
          animation: rs-spin .6s linear infinite; flex-shrink: 0;
        }
        @media (prefers-reduced-motion: reduce) { .rs-spinner { animation: none; opacity: .6; } }
        @keyframes rs-spin { to { transform: rotate(360deg); } }
        .rs-upload-preview {
          position: relative; border-radius: 9px; overflow: hidden;
          border: 1px solid var(--border);
        }
        .rs-upload-preview img { display: block; width: 100%; max-height: 120px; object-fit: cover; }
        .rs-upload-preview__remove {
          position: absolute; top: 6px; right: 6px;
          width: 24px; height: 24px; border-radius: 50%;
          background: rgba(0,0,0,.55); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; color: #fff;
          transition: background 150ms; touch-action: manipulation;
        }
        .rs-upload-preview__remove:hover { background: rgba(0,0,0,.8); }
        .rs-upload-preview__remove:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

        /* ── Notice banner ───────────────────────────── */
        .rs-notice {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 10px 12px; border-radius: 9px; font-size: .8rem;
          background: var(--surface-raised); border: 1px solid var(--border);
          color: var(--text-dim); line-height: 1.5;
        }
        .rs-notice a { color: var(--accent-bright); }
        .rs-notice code {
          background: var(--surface); padding: 1px 5px; border-radius: 4px; font-size: .78rem;
        }

        /* ── Form footer ─────────────────────────────── */
        .rs-form-footer {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding-top: 20px; margin-top: 20px;
          border-top: 1px dashed var(--border);
        }
        .rs-unsaved {
          font-size: .76rem; color: var(--text-faint);
          display: flex; align-items: center; gap: 5px;
        }
        .rs-unsaved-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--warning, #f59e0b);
          animation: rs-pulse 1.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) { .rs-unsaved-dot { animation: none; } }
        @keyframes rs-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }

        /* ── Preview column ──────────────────────────── */
        .rs-preview-col { display: flex; flex-direction: column; gap: 14px; }
        @media (min-width: 721px) { .rs-preview-col { position: sticky; top: 20px; } }
        .rs-preview-label {
          font-size: .68rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: .1em; color: var(--text-faint); font-family: var(--font-mono);
          display: flex; align-items: center; gap: 6px;
        }
        .rs-preview-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

        /* ════════════════════════════════════════════════════════════
           SIGNATURE ELEMENT — the voucher card.
           Same component shell as the old phone frame, restyled as a
           torn-edge receipt/SIM-top-up card with a dashed perforation
           and a slug rendered like a barcode strip. Built entirely on
           the app's existing --accent / --surface / --border tokens —
           no parallel colour system.
           ════════════════════════════════════════════════════════════ */
        .rs-voucher {
          margin: 0 auto; width: 100%; max-width: 300px;
          background: var(--surface-raised);
          border-radius: 4px 4px 18px 18px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 24px rgba(0,0,0,.1), inset 0 1px 0 rgba(255,255,255,.08);
          overflow: hidden; position: relative;
        }
        .rs-voucher__torn {
          height: 12px; position: relative; overflow: hidden;
          background: var(--surface-raised); color: var(--border);
        }
        .rs-voucher__torn svg { width: 100%; height: 100%; display: block; }
        .rs-voucher__body { overflow-y: auto; max-height: 540px; scrollbar-width: none; }
        .rs-voucher__body::-webkit-scrollbar { display: none; }

        .rs-voucher__banner { width: 100%; height: 80px; object-fit: cover; display: block; }
        .rs-voucher__banner-placeholder { height: 80px; }

        .rs-voucher__header { padding: 12px 14px; display: flex; align-items: center; gap: 10px; }
        .rs-voucher__logo {
          width: 38px; height: 38px; border-radius: 9px; overflow: hidden; flex-shrink: 0;
          border: 1px solid;
        }
        .rs-voucher__name    { font-weight: 800; font-size: .88rem; }
        .rs-voucher__tagline { font-size: .68rem; margin-top: 1px; }

        .rs-voucher__welcome {
          font-size: .7rem; line-height: 1.5; padding: 8px 14px;
          border-top: 1px solid; margin: 0;
        }

        /* Perforation divider between header and bundle list */
        .rs-voucher__perf-row { position: relative; height: 1px; margin: 2px 0; color: var(--border); }
        .rs-voucher__perf { width: 100%; height: 10px; display: block; }

        .rs-voucher__bundles { padding: 10px 10px 14px; display: flex; flex-direction: column; gap: 6px; }
        .rs-voucher__bundle {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px; border-radius: 8px; border: 1px solid;
        }
        .rs-voucher__net   { font-size: .66rem; font-weight: 800; }
        .rs-voucher__gb    { font-size: .74rem; font-weight: 600; }
        .rs-voucher__price { font-size: .76rem; font-weight: 700; font-family: var(--font-mono); }
        .rs-voucher__buy {
          font-size: .66rem; font-weight: 800; padding: 4px 10px;
          border: none; cursor: default; letter-spacing: .02em;
        }

        .rs-voucher__social {
          display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 14px 12px;
          border-top: 1px solid;
        }
        .rs-voucher__social-btn {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: .66rem; font-weight: 800; padding: 4px 10px;
          border-radius: 999px; border: none; cursor: default; white-space: nowrap;
        }

        /* Slug / SKU strip at the bottom of the voucher — barcode feel */
        .rs-voucher__slug-strip {
          padding: 9px 14px 11px;
          border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
        }
        .rs-voucher__slug {
          font-family: var(--font-mono); font-size: .68rem; font-weight: 700;
          letter-spacing: .05em; color: var(--text-dim);
        }
        .rs-voucher__barcode { display: flex; gap: 1.5px; align-items: flex-end; height: 16px; }
        .rs-voucher__barcode span { display: block; width: 2px; background: var(--text-faint); }

        /* ── Meta cards below preview ────────────────── */
        .rs-slug-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 999px; font-size: .73rem; font-weight: 700;
          font-family: var(--font-mono);
          background: var(--accent-soft); border: 1px solid var(--accent-border);
          color: var(--accent-bright);
        }
        .rs-live-row {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px;
          background: var(--surface-raised); border: 1px solid var(--border); border-radius: 10px;
        }
        .rs-live-row__url {
          flex: 1; min-width: 0; font-family: var(--font-mono); font-size: .71rem;
          color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .rs-live-row--empty { opacity: .55; }
        .rs-live-link {
          display: inline-flex; align-items: center; gap: 4px; font-size: .76rem;
          font-weight: 700; color: var(--accent-bright); text-decoration: none; flex-shrink: 0;
        }
        .rs-live-link:hover { text-decoration: underline; }
        .rs-live-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 3px; }
        .rs-share-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 11px; border-radius: 10px; font-size: .86rem; font-weight: 700;
          border: 1px solid var(--accent-border); background: var(--accent-soft);
          color: var(--accent-bright); cursor: pointer;
          touch-action: manipulation; -webkit-tap-highlight-color: transparent;
          transition: background 150ms, border-color 150ms;
        }
        .rs-share-btn:hover:not(:disabled) { background: rgba(44,123,229,.2); border-color: var(--accent); }
        .rs-share-btn:disabled { opacity: .45; cursor: not-allowed; }
        .rs-share-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .rs-tip {
          display: flex; gap: 8px; font-size: .78rem; color: var(--text-dim);
          line-height: 1.55; padding: 10px 12px;
          background: var(--surface-raised); border: 1px solid var(--border); border-radius: 9px;
        }
      `}</style>

      <main className="rs-page" aria-label="Store settings">
        {/* ── Header ── */}
        <div className="rs-header fade-in-up">
          <div className="rs-header__text">
            <span className="rs-eyebrow" aria-hidden="true">
              <Icon name="storefront" size={12} aria-hidden="true" /> Reseller
            </span>
            <h1>My store</h1>
            <p className="muted">Customise your storefront voucher. The preview on the right updates live.</p>
          </div>
        </div>

        {/* ── Skip link for keyboard nav ── */}
        <a href="#store-form" className="skip-link" style={{ position: 'absolute', left: -9999, top: 'auto' }}>
          Skip to store form
        </a>

        {/* ── Three-zone shell ── */}
        <div className="rs-shell">

          {/* Zone 1: Section nav */}
          <nav className="rs-nav" aria-label="Settings sections">
            {SECTIONS.map((s) => {
              const filled = (
                (s.id === 'identity' && (form.storeName || form.storeTagline || form.welcomeMessage)) ||
                (s.id === 'branding' && (form.themeColour !== '#2C7BE5' || form.storeTheme !== 'LIGHT' || form.buttonStyle !== 'ROUNDED')) ||
                (s.id === 'media'    && (form.storeLogoUrl || form.bannerImageUrl)) ||
                (s.id === 'social'   && (form.whatsappNumber || form.instagramHandle))
              );
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`rs-nav-btn${activeSection === s.id ? ' rs-nav-btn--active' : ''}`}
                  aria-current={activeSection === s.id ? 'true' : undefined}
                  onClick={() => setActiveSection(s.id)}
                >
                  <span className="rs-nav-btn__tag">{s.tag}</span>
                  {s.label}
                  {filled && <span className="rs-nav-dot" aria-hidden="true" />}
                </button>
              );
            })}
          </nav>

          {/* Zone 2: Form */}
          <div className="rs-form-col fade-in-up delay-1">
            <div className="card" id="store-form">
              <form onSubmit={handleSubmit} noValidate>
                <div key={activeSection} style={{ animation: 'fadeInUp .18s ease both' }}>
                  {sectionContent[activeSection]}
                </div>

                {/* Section navigation pills inside form */}
                <div style={{
                  display: 'flex', gap: 8, marginTop: 20, paddingTop: 16,
                  borderTop: '1px dashed var(--border)', flexWrap: 'wrap',
                }}>
                  {SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`rs-pill${activeSection === s.id ? ' rs-pill--active' : ''}`}
                      style={{ fontSize: '.72rem', padding: '5px 12px' }}
                      onClick={() => setActiveSection(s.id)}
                      aria-current={activeSection === s.id ? 'step' : undefined}
                    >
                      {s.tag} {s.label}
                    </button>
                  ))}
                </div>

                {/* Footer */}
                <div className="rs-form-footer">
                  <span className="rs-unsaved" aria-live="polite">
                    {dirty && (
                      <>
                        <span className="rs-unsaved-dot" aria-hidden="true" />
                        Unsaved changes
                      </>
                    )}
                  </span>
                  <button
                    className="btn btn--primary"
                    type="submit"
                    disabled={busy}
                    aria-busy={busy}
                  >
                    {busy ? 'Saving…' : 'Save store'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Zone 3: Live preview + meta */}
          <div className="rs-preview-col fade-in-up delay-2" aria-label="Live store preview" role="region">
            <p className="rs-preview-label">
              <Icon name="receipt_long" size={11} aria-hidden="true" /> Voucher preview
            </p>

            {/* ── Voucher card (signature element) ── */}
            <div className="rs-voucher" aria-hidden="true">
              <div className="rs-voucher__torn">
                <svg viewBox="0 0 300 14" preserveAspectRatio="none">
                  <path
                    d="M0,14 L0,6 L8,11 L16,3 L24,10 L32,4 L40,12 L48,2 L56,9 L64,5 L72,13 L80,1 L88,8 L96,6 L104,11 L112,3 L120,10 L128,4 L136,12 L144,2 L152,9 L160,5 L168,13 L176,1 L184,8 L192,6 L200,11 L208,3 L216,10 L224,4 L232,12 L240,2 L248,9 L256,5 L264,13 L272,1 L280,8 L288,6 L296,11 L300,8 L300,14 Z"
                    fill={pv.bg}
                  />
                </svg>
              </div>

              <div className="rs-voucher__body" style={{ background: pv.bg }}>
                {form.bannerImageUrl ? (
                  <img
                    src={form.bannerImageUrl}
                    alt=""
                    className="rs-voucher__banner"
                    width="300"
                    height="80"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div
                    className="rs-voucher__banner-placeholder"
                    style={{
                      background: `linear-gradient(135deg, ${accent}44 0%, ${accent}18 100%)`,
                      borderBottom: `2px solid ${accent}`,
                    }}
                  />
                )}

                <div className="rs-voucher__header" style={{ borderBottom: `1px solid ${pv.border}` }}>
                  <div className="rs-voucher__logo" style={{ borderColor: pv.border }}>
                    {form.storeLogoUrl ? (
                      <img
                        src={form.storeLogoUrl}
                        alt=""
                        width="38"
                        height="38"
                        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <LogoFallback name={displayName} colour={accent} />
                    )}
                  </div>
                  <div>
                    <div className="rs-voucher__name" style={{ color: pv.text }}>{displayName}</div>
                    <div className="rs-voucher__tagline" style={{ color: pv.muted }}>
                      {form.storeTagline || 'Your tagline'}
                    </div>
                  </div>
                </div>

                {form.welcomeMessage && (
                  <p
                    className="rs-voucher__welcome"
                    style={{ borderTopColor: pv.border, color: pv.muted, background: pv.surface }}
                  >
                    {form.welcomeMessage.slice(0, 120)}{form.welcomeMessage.length > 120 ? '…' : ''}
                  </p>
                )}

                <div className="rs-voucher__perf-row" style={{ color: pv.border }}>
                  <PerforatedEdge />
                </div>

                <div className="rs-voucher__bundles">
                  {DUMMY_BUNDLES.map((b, i) => (
                    <div key={i} className="rs-voucher__bundle" style={{ background: pv.surface, borderColor: pv.border }}>
                      <div>
                        <div className="rs-voucher__net" style={{ color: accent }}>{b.network}</div>
                        <div className="rs-voucher__gb" style={{ color: pv.text }}>{b.gb}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="rs-voucher__price" style={{ color: pv.text }}>{b.price}</span>
                        <span className="rs-voucher__buy" style={{ background: accent, color: '#fff', borderRadius: pv.btnR }}>
                          Buy
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {(form.whatsappNumber || form.instagramHandle) && (
                  <div className="rs-voucher__social" style={{ borderTopColor: pv.border, background: pv.surface }}>
                    {form.whatsappNumber && (
                      <span className="rs-voucher__social-btn" style={{ background: '#25D366', color: '#fff' }}>
                        WhatsApp
                      </span>
                    )}
                    {form.instagramHandle && (
                      <span
                        className="rs-voucher__social-btn"
                        style={{
                          background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
                          color: '#fff',
                        }}
                      >
                        @{form.instagramHandle.replace(/^@/, '')}
                      </span>
                    )}
                  </div>
                )}

                {/* SKU / barcode strip — the receipt-card detail */}
                <div className="rs-voucher__slug-strip">
                  <span className="rs-voucher__slug">{settings?.storeSlug ?? 'your-slug'}</span>
                  <div className="rs-voucher__barcode" aria-hidden="true">
                    {[6,3,8,4,2,7,3,9,5,2,6,4,8,3].map((h, i) => (
                      <span key={i} style={{ height: `${h * 1.6}px` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Slug chip — only shown when slug exists */}
            {settings?.storeSlug && (
              <div className="card" style={{ padding: '12px 14px' }}>
                <p className="muted" style={{ fontSize: '.76rem', marginBottom: 8 }}>
                  Your slug is permanent — changing it would break existing links.
                </p>
                <span className="rs-slug-chip">
                  <Icon name="tag" size={12} aria-hidden="true" />
                  {settings.storeSlug}
                </span>
              </div>
            )}

            {/* Live link — guarded: only render when storeUrl is not null */}
            {storeUrl ? (
              <div className="rs-live-row">
                <Icon name="open_in_new" size={14} style={{ color: 'var(--text-faint)', flexShrink: 0 }} aria-hidden="true" />
                <span className="rs-live-row__url">{storeUrl}</span>
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rs-live-link"
                  aria-label={`Visit ${displayName} store (opens in new tab)`}
                >
                  Visit <Icon name="arrow_outward" size={12} aria-hidden="true" />
                </a>
              </div>
            ) : (
              <div className="rs-live-row rs-live-row--empty">
                <Icon name="info" size={14} style={{ color: 'var(--text-faint)', flexShrink: 0 }} aria-hidden="true" />
                <span className="rs-live-row__url">Store link not available yet</span>
              </div>
            )}

            {/* Share button — disabled when no slug */}
            <button
              className="rs-share-btn"
              type="button"
              onClick={openShare}
              disabled={shareLoading || !settings?.storeSlug}
              aria-busy={shareLoading}
              title={!settings?.storeSlug ? 'Store link not available yet' : undefined}
            >
              <Icon name="share" size={16} aria-hidden="true" />
              {shareLoading ? 'Loading…' : 'Share store & QR code'}
            </button>

            {/* Tip */}
            <div className="rs-tip" role="note">
              <Icon name="lightbulb" size={14} style={{ color: 'var(--accent-bright)', flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
              Share your store link on WhatsApp or print the QR&nbsp;code. Customers can buy bundles
              24/7 without contacting you.
            </div>
          </div>
        </div>
      </main>

      {/* Share flyout */}
      <ShareFlyout
        open={flyoutOpen}
        onClose={() => setFlyoutOpen(false)}
        storeUrl={shareInfo?.storeUrl    ?? storeUrl ?? ''}
        referralUrl={shareInfo?.referralUrl ?? ''}
        storeName={shareInfo?.storeName   ?? settings?.storeName ?? 'Your store'}
      />
    </>
  );
}