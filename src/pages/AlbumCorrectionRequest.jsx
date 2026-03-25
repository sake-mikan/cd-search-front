import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

const INITIAL_FORM = {
  field_key: '',
  source_url: '',
  comment: '',
  challenge_answer: '',
  nickname: '',
};

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
  return message !== '' ? [message] : ['送信に失敗しました。'];
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
        challenge_answer: '',
        nickname: '',
      }));
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
  const challenge = meta?.challenge ?? null;
  const themeLabel = isDarkMode ? 'ライト' : 'ダーク';
  const themeTitle = isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!challenge?.token) return;

    setSubmitting(true);
    setErrorMessages([]);
    setSuccessMessage('');

    try {
      const response = await submitAlbumCorrectionRequest(id, {
        field_key: form.field_key,
        source_url: form.source_url,
        comment: form.comment,
        challenge_token: challenge.token,
        challenge_answer: form.challenge_answer,
        nickname: form.nickname,
      });

      setSuccessMessage(String(response.data?.message ?? '修正依頼を受け付けました。'));
      setForm({ ...INITIAL_FORM, field_key: String(fieldOptions[0]?.value ?? '') });
      await loadForm();
    } catch (error) {
      setErrorMessages(collectErrorMessages(error));
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
          className={outlineButtonClass}
        >
          アルバム詳細へ戻る
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-[2rem]">情報修正依頼フォーム</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                情報ソースURLや補足コメントを添えて送信すると、内容を確認のうえ順次対応しますが、状況により反映までお時間をいただく場合があります。
              </p>
            </div>
            <Link to={getAlbumRoutePath(album, id)} className={outlineButtonClass}>
              詳細ページを見る
            </Link>
          </div>
        </div>

        <div className={panelMutedClass}>
          <div className="text-sm text-slate-500 dark:text-slate-300">対象アルバム</div>
          <div className="mt-1 text-lg font-semibold">{album?.title ?? `アルバム: ${albumRouteId || id}`}</div>
          <div className="mt-2 grid gap-2 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2">
            <div>アルバムアーティスト: {album?.album_artist?.name ?? '-'}</div>
            <div>規格品番: {album?.catalog_number ?? '-'}</div>
            <div>形態: {album?.edition && album.edition !== '' ? album.edition : '-'}</div>
            <div>情報時点: {formattedInfoTimestamp}</div>
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
              <span className="mb-2 block font-medium">修正してほしい項目</span>
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
              <span className="mb-2 block font-medium">情報ソースURL</span>
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
            <span className="mb-2 block font-medium">詳細コメント</span>
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleChange}
              disabled={loading || submitting}
              rows={7}
              placeholder="どの情報をどう直してほしいかを詳しく記載してください。参考になるトラック番号や補足もあれば記載してください。"
              className={textareaClass}
            />
          </label>

          <div className={panelMutedClass}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">ロボット確認</div>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  {challenge?.prompt ? `次の計算結果を入力してください: ${challenge.prompt}` : '確認問題を読み込み中です...' }
                </div>
              </div>
              <button
                type="button"
                onClick={loadForm}
                disabled={loading || submitting}
                className={outlineButtonClass}
              >
                <RefreshCw className="h-4 w-4" />
                画像を更新
              </button>
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-end">
              <label className="block text-sm">
                <span className="mb-2 block font-medium">答え</span>
                <input
                  type="text"
                  inputMode="numeric"
                  name="challenge_answer"
                  value={form.challenge_answer}
                  onChange={handleChange}
                  disabled={loading || submitting}
                  className={inputClass}
                />
              </label>

              <label className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <span>入力しないでください</span>
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
              disabled={loading || submitting || !challenge?.token}
              className={primaryButtonClass}
            >
              <Send className="h-4 w-4" />
              {submitting ? '送信中...' : '修正依頼を送信'}
            </button>
          </div>
        </form>
      </div>
      <SiteFooter />
    </div>
  );
}
