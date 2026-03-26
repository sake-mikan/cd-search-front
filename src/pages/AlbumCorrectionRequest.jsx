import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Moon, RefreshCw, Send, Sun } from 'lucide-react';
import { fetchAlbumCorrectionRequestForm, submitAlbumCorrectionRequest } from '../api/correctionRequests';
import { formatInfoTimestamp } from '../utils/formatDateTime';
import SiteFooter from '../components/SiteFooter';
import { getAlbumRouteId, getAlbumRoutePath } from '../utils/albumPublicId';
import {
  PageBackdrop,
  floatingThemeButtonClass,
  heroPanelClass,
  inputClass,
  mobileThemeButtonClass,
  outlineButtonClass,
  pageCardClass,
  pageShellClass,
  panelMutedClass,
  primaryButtonClass,
  textareaClass,
} from '../utils/uiTheme';

const LABELS = {
  unavailable: 'Turnstile is unavailable.',
  loadFailed: 'Turnstile failed to load.',
  submitFailed: '\u9001\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002',
  light: '\u30E9\u30A4\u30C8',
  dark: '\u30C0\u30FC\u30AF',
  switchToLight: '\u30E9\u30A4\u30C8\u30E2\u30FC\u30C9\u306B\u5207\u308A\u66FF\u3048',
  switchToDark: '\u30C0\u30FC\u30AF\u30E2\u30FC\u30C9\u306B\u5207\u308A\u66FF\u3048',
  backToAlbum: '\u30A2\u30EB\u30D0\u30E0\u8A73\u7D30\u3078\u623B\u308B',
  pageTitle: '\u60C5\u5831\u4FEE\u6B63\u4F9D\u983C\u30D5\u30A9\u30FC\u30E0',
  pageLeadPrimary: '\u60C5\u5831\u30BD\u30FC\u30B9URL\u3084\u88DC\u8DB3\u30B3\u30E1\u30F3\u30C8\u3092\u6DFB\u3048\u3066\u9001\u4FE1\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
  pageLeadSecondary: '\u5185\u5BB9\u3092\u78BA\u8A8D\u306E\u3046\u3048\u9806\u6B21\u5BFE\u5FDC\u3057\u307E\u3059\u304C\u3001\u72B6\u6CC1\u306B\u3088\u308A\u53CD\u6620\u307E\u3067\u304A\u6642\u9593\u3092\u3044\u305F\u3060\u304F\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002',
  targetAlbum: '\u5BFE\u8C61\u30A2\u30EB\u30D0\u30E0',
  albumFallbackPrefix: '\u30A2\u30EB\u30D0\u30E0: ',
  albumArtist: '\u30A2\u30EB\u30D0\u30E0\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8',
  catalogNumber: '\u898F\u683C\u54C1\u756A',
  edition: '\u5F62\u614B',
  informationTimestamp: '\u60C5\u5831\u6642\u70B9',
  fieldKey: '\u4FEE\u6B63\u3057\u3066\u307B\u3057\u3044\u9805\u76EE',
  sourceUrl: '\u60C5\u5831\u30BD\u30FC\u30B9URL',
  comment: '\u8A73\u7D30\u30B3\u30E1\u30F3\u30C8',
  commentPlaceholder:
    '\u3069\u306E\u60C5\u5831\u3092\u3069\u3046\u76F4\u3057\u3066\u307B\u3057\u3044\u304B\u3092\u8A73\u3057\u304F\u8A18\u8F09\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u53C2\u8003\u306B\u306A\u308B\u30C8\u30E9\u30C3\u30AF\u756A\u53F7\u3084\u88DC\u8DB3\u3082\u3042\u308C\u3070\u8A18\u8F09\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
  robotCheck: '\u30ED\u30DC\u30C3\u30C8\u78BA\u8A8D',
  turnstileMissing: '\u8A8D\u8A3C\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
  refreshVerification: '\u8A8D\u8A3C\u3092\u66F4\u65B0',
  turnstileTimeout:
    '\u8A8D\u8A3C\u306E\u6709\u52B9\u671F\u9650\u304C\u5207\u308C\u307E\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u8A8D\u8A3C\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
  turnstileError:
    '\u8A8D\u8A3C\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u8A66\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
  turnstileReload:
    '\u8A8D\u8A3C\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u30DA\u30FC\u30B8\u3092\u518D\u8AAD\u307F\u8FBC\u307F\u3057\u3066\u304F\u3060\u3055\u3044\u3002',
  turnstileMissingConfig: 'Turnstile \u306E\u8A2D\u5B9A\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002',
  honeypot: '\u5165\u529B\u3057\u306A\u3044\u3067\u304F\u3060\u3055\u3044',
  submit: '\u4FEE\u6B63\u4F9D\u983C\u3092\u9001\u4FE1',
  submitting: '\u9001\u4FE1\u4E2D...',
  accepted: '\u4FEE\u6B63\u4F9D\u983C\u3092\u53D7\u3051\u4ED8\u3051\u307E\u3057\u305F\u3002',
};

const INITIAL_FORM = {
  field_key: '',
  source_url: '',
  comment: '',
  nickname: '',
};

let turnstileScriptPromise = null;

function loadTurnstileScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error(LABELS.unavailable));
  }

  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (!turnstileScriptPromise) {
    turnstileScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-turnstile-script="true"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.turnstile), { once: true });
        existingScript.addEventListener('error', () => reject(new Error(LABELS.loadFailed)), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.turnstileScript = 'true';
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => reject(new Error(LABELS.loadFailed));
      document.head.appendChild(script);
    });
  }

  return turnstileScriptPromise;
}

function collectErrorMessages(error) {
  const messages = [];
  const responseErrors = error?.response?.data?.errors ?? {};

  Object.values(responseErrors).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => messages.push(String(item)));
      return;
    }

    if (value != null) {
      messages.push(String(value));
    }
  });

  if (messages.length > 0) return messages;

  const message = String(error?.response?.data?.message ?? error?.message ?? '').trim();
  return message !== '' ? [message] : [LABELS.submitFailed];
}

export default function AlbumCorrectionRequest({ isDarkMode = false, onToggleTheme = () => {} }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);

  const loadForm = async ({ preserveErrors = false } = {}) => {
    setLoading(true);
    if (!preserveErrors) {
      setErrorMessages([]);
    }

    try {
      const response = await fetchAlbumCorrectionRequestForm(id);
      const payload = response.data ?? {};
      setMeta(payload);
      setForm((current) => ({
        ...current,
        field_key: current.field_key || String(payload?.field_options?.[0]?.value ?? ''),
        nickname: '',
      }));
      setTurnstileToken('');
      setTurnstileError('');
    } catch (error) {
      setErrorMessages(collectErrorMessages(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const album = meta?.album ?? null;
  const albumRouteId = useMemo(() => getAlbumRouteId(album, id), [album, id]);
  const fieldOptions = Array.isArray(meta?.field_options) ? meta.field_options : [];
  const turnstileSiteKey = String(meta?.turnstile?.site_key ?? import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').trim();
  const turnstileEnabled = Boolean(meta?.turnstile?.enabled) && turnstileSiteKey !== '';
  const themeLabel = isDarkMode ? LABELS.light : LABELS.dark;
  const themeTitle = isDarkMode ? LABELS.switchToLight : LABELS.switchToDark;
  const formattedInfoTimestamp = useMemo(
    () => formatInfoTimestamp(album?.information_updated_at),
    [album?.information_updated_at]
  );

  useEffect(() => {
    if (!album?.public_id) return;
    if (!/^\d+$/.test(String(id ?? '').trim())) return;
    if (String(id) === String(album.public_id)) return;
    navigate(`${getAlbumRoutePath(album, id)}/correction-request`, { replace: true });
  }, [album, id, navigate]);

  useEffect(() => {
    if (!turnstileEnabled || !turnstileContainerRef.current) {
      return undefined;
    }

    let cancelled = false;
    const container = turnstileContainerRef.current;

    setTurnstileToken('');
    setTurnstileError('');

    const renderTurnstile = async () => {
      try {
        await loadTurnstileScript();

        if (cancelled || !container || !window.turnstile) {
          return;
        }

        if (turnstileWidgetIdRef.current !== null && typeof window.turnstile.remove === 'function') {
          try {
            window.turnstile.remove(turnstileWidgetIdRef.current);
          } catch {
            // noop
          }
        }

        container.innerHTML = '';
        turnstileWidgetIdRef.current = window.turnstile.render(container, {
          sitekey: turnstileSiteKey,
          theme: isDarkMode ? 'dark' : 'light',
          callback: (token) => {
            if (cancelled) return;
            setTurnstileToken(String(token ?? ''));
            setTurnstileError('');
          },
          'expired-callback': () => {
            if (cancelled) return;
            setTurnstileToken('');
          },
          'timeout-callback': () => {
            if (cancelled) return;
            setTurnstileToken('');
            setTurnstileError(LABELS.turnstileTimeout);
          },
          'error-callback': () => {
            if (cancelled) return;
            setTurnstileToken('');
            setTurnstileError(LABELS.turnstileError);
          },
        });
      } catch {
        if (cancelled) return;
        setTurnstileToken('');
        setTurnstileError(LABELS.turnstileReload);
      }
    };

    renderTurnstile();

    return () => {
      cancelled = true;
      if (turnstileWidgetIdRef.current !== null && window.turnstile && typeof window.turnstile.remove === 'function') {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current);
        } catch {
          // noop
        }
      }
      turnstileWidgetIdRef.current = null;
      container.innerHTML = '';
    };
  }, [id, isDarkMode, turnstileEnabled, turnstileSiteKey]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleTurnstileRefresh = () => {
    setTurnstileToken('');
    setTurnstileError('');

    if (turnstileWidgetIdRef.current !== null && window.turnstile && typeof window.turnstile.reset === 'function') {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!turnstileEnabled || turnstileToken === '') return;

    setSubmitting(true);
    setErrorMessages([]);
    setSuccessMessage('');

    try {
      const response = await submitAlbumCorrectionRequest(id, {
        field_key: form.field_key,
        source_url: form.source_url,
        comment: form.comment,
        turnstile_token: turnstileToken,
        nickname: form.nickname,
      });

      setSuccessMessage(String(response.data?.message ?? LABELS.accepted));
      setForm({ ...INITIAL_FORM, field_key: String(fieldOptions[0]?.value ?? '') });
      handleTurnstileRefresh();
      await loadForm();
    } catch (error) {
      setErrorMessages(collectErrorMessages(error));
      handleTurnstileRefresh();
      await loadForm({ preserveErrors: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={pageShellClass}>
      <PageBackdrop />

      <button
        type="button"
        onClick={onToggleTheme}
        className={floatingThemeButtonClass}
        title={themeTitle}
        aria-label={themeTitle}
      >
        {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        <span>{themeLabel}</span>
      </button>

      <div className="mx-auto mb-3 flex max-w-4xl items-center justify-between gap-2 lg:justify-start">
        <button
          type="button"
          onClick={() => navigate(getAlbumRoutePath(album, id))}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700"
        >
          {LABELS.backToAlbum}
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className={`${mobileThemeButtonClass} lg:hidden`}
          title={themeTitle}
          aria-label={themeTitle}
        >
          {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span>{themeLabel}</span>
        </button>
      </div>

      <div className={`${pageCardClass} max-w-4xl`}>
        <div className={heroPanelClass}>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">{LABELS.pageTitle}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              <span className="block">{LABELS.pageLeadPrimary}</span>
              <span className="mt-1 block">{LABELS.pageLeadSecondary}</span>
            </p>
          </div>
        </div>

        <div className={panelMutedClass}>
          <div className="text-sm text-slate-500 dark:text-slate-300">{LABELS.targetAlbum}</div>
          <div className="mt-1 text-lg font-semibold">{album?.title ?? `${LABELS.albumFallbackPrefix}${albumRouteId || id}`}</div>
          <div className="mt-2 grid gap-2 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2">
            <div>{LABELS.albumArtist}: {album?.album_artist?.name ?? '-'}</div>
            <div>{LABELS.catalogNumber}: {album?.catalog_number ?? '-'}</div>
            <div>{LABELS.edition}: {album?.edition && album.edition !== '' ? album.edition : '-'}</div>
            <div>{LABELS.informationTimestamp}: {formattedInfoTimestamp}</div>
          </div>
        </div>

        {errorMessages.length > 0 && (
          <div className="mt-5 rounded-[24px] border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 sm:px-5">
            <ul className="space-y-1">
              {errorMessages.map((message, index) => (
                <li key={`${message}-${index}`}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-700 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200 sm:px-5">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-2 block font-medium">{LABELS.fieldKey}</span>
              <select
                name="field_key"
                value={form.field_key}
                onChange={handleChange}
                disabled={loading || submitting}
                className={inputClass}
              >
                {fieldOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-2 block font-medium">{LABELS.sourceUrl}</span>
              <input
                type="url"
                name="source_url"
                value={form.source_url}
                onChange={handleChange}
                disabled={loading || submitting}
                placeholder="https://example.com/source"
                className={inputClass}
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-2 block font-medium">{LABELS.comment}</span>
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              disabled={loading || submitting}
              rows={7}
              placeholder={LABELS.commentPlaceholder}
              className={textareaClass}
            />
          </label>

          <div className={panelMutedClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">{LABELS.robotCheck}</div>
                {!turnstileEnabled && (
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">{LABELS.turnstileMissing}</div>
                )}
              </div>
              <button
                type="button"
                onClick={handleTurnstileRefresh}
                disabled={loading || submitting || !turnstileEnabled}
                className={outlineButtonClass}
              >
                <RefreshCw className="h-4 w-4" />
                {LABELS.refreshVerification}
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div
                ref={turnstileContainerRef}
                className="min-h-[68px] rounded-2xl border border-dashed border-slate-200/80 bg-white/70 p-2 dark:border-slate-600 dark:bg-slate-800/60"
              />

              {turnstileError && (
                <div className="text-sm text-red-600 dark:text-red-300">{turnstileError}</div>
              )}

              {!turnstileEnabled && (
                <div className="text-sm text-amber-700 dark:text-amber-300">{LABELS.turnstileMissingConfig}</div>
              )}

              <label className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <span>{LABELS.honeypot}</span>
                <input
                  type="text"
                  name="nickname"
                  value={form.nickname}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading || submitting || !turnstileEnabled || turnstileToken === ''}
              className={primaryButtonClass}
            >
              <Send className="h-4 w-4" />
              {submitting ? LABELS.submitting : LABELS.submit}
            </button>
          </div>
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}
