'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Moon, RefreshCw, Send, Sun } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAlbumCorrectionRequestForm, submitAlbumCorrectionRequest } from '@/lib/api';
import InfoCard from '@/components/InfoCard';
import PageHeaderCard from '@/components/PageHeaderCard';
import SiteBrandHeader from '@/components/SiteBrandHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAlbumRouteId, getAlbumRoutePath } from '@/utils/albumPublicId';
import { formatInfoTimestamp } from '@/utils/formatDateTime';
import {
  inputClass,
  outlineButtonClass,
  pageCardClass,
  pageShellClass,
  PageBackdrop,
  panelMutedClass,
  primaryButtonClass,
  mobileThemeButtonClass,
  textareaClass,
  floatingThemeButtonClass,
  ThemeToggle,
} from '@/utils/uiTheme';
import { useTheme } from '@/components/ThemeProvider';

const LABELS = {
  unavailable: 'Turnstile is unavailable.',
  loadFailed: 'Turnstile failed to load.',
  submitFailed: '送信に失敗しました。',
  backToAlbum: 'アルバム詳細へ戻る',
  pageTitle: '情報修正依頼フォーム',
  pageLeadPrimary: '情報ソースURLや補足コメントを添えて送信してください。',
  pageLeadSecondary: '内容を確認のうえ順次対応しますが、状況により反映までお時間をいただく場合があります。',
  targetAlbum: '対象アルバム',
  albumFallbackPrefix: 'アルバム: ',
  albumArtist: 'アルバムアーティスト',
  catalogNumber: '規格品番',
  edition: '形態',
  informationTimestamp: '情報時点',
  fieldKey: '修正してほしい項目',
  sourceUrl: '情報ソースURL',
  requesterName: '送信者名（ニックネーム可）',
  requesterNamePlaceholder: '任意入力',
  comment: '詳細コメント',
  commentPlaceholder: 'どの情報をどのように直してほしいか、根拠URLや補足も含めて記載してください。',
  robotCheck: 'ロボット確認',
  turnstileMissing: '認証設定を確認してください。',
  refreshVerification: '認証を更新',
  turnstileTimeout: '認証の有効期限が切れました。もう一度認証してください。',
  turnstileError: '認証の読み込みに失敗しました。もう一度試してください。',
  turnstileReload: '認証の読み込みに失敗しました。ページを再読み込みしてください。',
  turnstileMissingConfig: 'Turnstile の設定が見つかりません。',
  honeypot: '入力しないでください',
  submit: '修正依頼を送信',
  submitting: '送信中...',
  accepted: '修正依頼を受け付けました。',
};

const INITIAL_FORM = {
  field_key: '',
  source_url: '',
  requester_name: '',
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
    if (value != null) messages.push(String(value));
  });

  if (messages.length > 0) return messages;

  const message = String(error?.response?.data?.message ?? error?.message ?? '').trim();
  return message !== '' ? [message] : [LABELS.submitFailed];
}

export default function AlbumCorrectionRequestPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();

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

  const loadForm = useCallback(async ({ preserveErrors = false } = {}) => {
    setLoading(true);
    if (!preserveErrors) setErrorMessages([]);

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
  }, [id]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const album = meta?.album ?? null;
  const albumRouteId = useMemo(() => getAlbumRouteId(album, id), [album, id]);
  const fieldOptions = Array.isArray(meta?.field_options) ? meta.field_options : [];
  const turnstileSiteKey = String(meta?.turnstile?.site_key ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '').trim();
  const turnstileEnabled = Boolean(meta?.turnstile?.enabled) && turnstileSiteKey !== '';
  const formattedInfoTimestamp = useMemo(() => formatInfoTimestamp(album?.information_updated_at), [album?.information_updated_at]);

  useEffect(() => {
    if (!album?.public_id) return;
    if (!/^\d+$/.test(String(id ?? '').trim())) return;
    if (String(id) === String(album.public_id)) return;
    router.replace(`${getAlbumRoutePath(album, id)}/correction-request`);
  }, [album, id, router]);

  useEffect(() => {
    if (!turnstileEnabled || !turnstileContainerRef.current) return undefined;

    let cancelled = false;
    const container = turnstileContainerRef.current;
    setTurnstileToken('');
    setTurnstileError('');

    const renderTurnstile = async () => {
      try {
        await loadTurnstileScript();
        if (cancelled || !container || !window.turnstile) return;

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
        requester_name: form.requester_name,
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
      <ThemeToggle />
      <div className={`${pageCardClass} max-w-4xl space-y-6`}>
        <SiteBrandHeader
          actions={<>
            <button type="button" onClick={() => router.push(getAlbumRoutePath(album, id))} className="inline-flex h-12 items-center justify-center rounded-full bg-sky-500 px-8 text-sm font-black text-white shadow-[0_10px_20px_rgba(14,165,233,0.3)] transition-all hover:bg-sky-400 hover:shadow-[0_15px_30px_rgba(14,165,233,0.5)] active:scale-95">
              {LABELS.backToAlbum}
            </button>
          </>}
        />
        <PageHeaderCard
          maxWidthClass="max-w-4xl"
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          showFloatingThemeButton={false}
          showMobileThemeButton={false}
          badge="CORRECTION REQUEST"
          title={LABELS.pageTitle}
          subtitle={`${LABELS.pageLeadPrimary} ${LABELS.pageLeadSecondary}`}
        />

        <InfoCard title={LABELS.targetAlbum}>
          <div className={panelMutedClass}>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{album?.title ?? `${LABELS.albumFallbackPrefix}${albumRouteId || id}`}</div>
            <div className="mt-3 grid gap-2 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2">
              <div>{LABELS.albumArtist}: {album?.album_artist?.name ?? '-'}</div>
              <div>{LABELS.catalogNumber}: {album?.catalog_number_display || album?.catalog_number || '-'}</div>
              <div>{LABELS.edition}: {album?.edition && album.edition !== '' ? album.edition : '-'}</div>
              <div>{LABELS.informationTimestamp}: {formattedInfoTimestamp}</div>
            </div>
          </div>
        </InfoCard>

        {errorMessages.length > 0 ? (
          <InfoCard title="送信エラー" description="入力内容を確認してください。">
            <ul className="space-y-1 text-sm text-red-600 dark:text-red-300">
              {errorMessages.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}
            </ul>
          </InfoCard>
        ) : null}

        {successMessage ? <InfoCard title="送信完了" description={successMessage} /> : null}

        <InfoCard title="修正内容を入力" description="根拠URLや補足コメントがあると確認しやすくなります。">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-2 block font-medium">{LABELS.fieldKey}<span className="ml-1 text-red-500">*</span></span>
                <select name="field_key" value={form.field_key} onChange={handleChange} disabled={loading || submitting} className={inputClass}>
                  {fieldOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-2 block font-medium">{LABELS.sourceUrl}</span>
                <input type="url" name="source_url" value={form.source_url} onChange={handleChange} disabled={loading || submitting} placeholder="https://example.com/source" className={inputClass} />
              </label>
            </div>
            <label className="block text-sm sm:max-w-[360px]">
              <span className="mb-2 block font-medium">{LABELS.requesterName}</span>
              <input type="text" name="requester_name" value={form.requester_name} onChange={handleChange} disabled={loading || submitting} placeholder={LABELS.requesterNamePlaceholder} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="mb-2 block font-medium">{LABELS.comment}<span className="ml-1 text-red-500">*</span></span>
              <textarea name="comment" value={form.comment} onChange={handleChange} disabled={loading || submitting} rows={7} placeholder={LABELS.commentPlaceholder} className={textareaClass} />
            </label>

            <div className={panelMutedClass}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium">{LABELS.robotCheck}<span className="ml-1 text-red-500">*</span></div>
                  {!turnstileEnabled ? <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">{LABELS.turnstileMissing}</div> : null}
                </div>
                <button type="button" onClick={handleTurnstileRefresh} disabled={loading || submitting || !turnstileEnabled} className={outlineButtonClass}>
                  <RefreshCw className="h-4 w-4" />{LABELS.refreshVerification}
                </button>
              </div>

              <div className="mt-3 space-y-3">
                <div ref={turnstileContainerRef} className="min-h-[68px] rounded-2xl border border-dashed border-slate-200/80 bg-white/70 p-2 dark:border-slate-600 dark:bg-slate-800/60" />
                {turnstileError ? <div className="text-sm text-red-600 dark:text-red-300">{turnstileError}</div> : null}
                {!turnstileEnabled ? <div className="text-sm text-amber-700 dark:text-amber-300">{LABELS.turnstileMissingConfig}</div> : null}
                <label className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                  <span>{LABELS.honeypot}</span>
                  <input type="text" name="nickname" value={form.nickname} onChange={handleChange} tabIndex={-1} autoComplete="off" />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" disabled={loading || submitting || !turnstileEnabled || turnstileToken === ''} className={primaryButtonClass}>
                <Send className="h-4 w-4" />{submitting ? LABELS.submitting : LABELS.submit}
              </button>
            </div>
          </form>
        </InfoCard>
      </div>
      <SiteFooter />
    </div>
  );
}

