'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ScanBarcode, Smartphone } from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';
import SiteFooter from '@/components/SiteFooter';
import { submitScannerSessionJan } from '@/lib/api';
import { inputClass, pageCardClass, pageShellClass, PageBackdrop, primaryButtonClass } from '@/utils/uiTheme';

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export default function MobileScannerClient({ sessionId }) {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState('');
  const [janCode, setJanCode] = useState('');
  const [manualJan, setManualJan] = useState('');

  const submitJan = async (code) => {
    if (status === 'sending' || status === 'sent') return;

    const normalized = String(code ?? '').replace(/\D+/g, '');
    setStatus('sending');
    setError('');

    try {
      const payload = await submitScannerSessionJan(sessionId, {
        token,
        jan_code: normalized,
      });
      setJanCode(String(payload?.jan_code ?? normalized));
      setStatus('sent');
    } catch (err) {
      const responseStatus = err?.response?.status;
      setStatus(responseStatus === 410 ? 'expired' : 'error');
      setError(getErrorMessage(err, 'JANコードをPCへ送信できませんでした。'));
    }
  };

  const handleManualSubmit = (event) => {
    event.preventDefault();
    submitJan(manualJan);
  };

  const isTokenMissing = token === '';
  const isDone = status === 'sent';
  const isUnavailable = isTokenMissing || status === 'expired';

  return (
    <div className={pageShellClass}>
      <PageBackdrop />
      <main className={`${pageCardClass} flex items-center justify-center py-10`}>
        <section className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200/40 bg-white/85 p-5 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/75">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
              <Smartphone className="h-3.5 w-3.5" />
              PC CONNECTED
            </span>

            <div className="space-y-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {isDone ? 'JANコードを送信しました' : 'PCと接続しました'}
              </h1>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {isDone
                  ? 'PC画面をご確認ください。この画面は閉じても大丈夫です。'
                  : 'このスマホはJANコード読み取り専用です。読み取った結果はPC側に送信されます。'}
              </p>
            </div>

            {isDone ? (
              <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-400/25 dark:bg-emerald-400/10">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <p className="mt-3 text-sm font-bold text-emerald-800 dark:text-emerald-100">送信済み JAN: {janCode}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {isTokenMissing ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                    スキャン用トークンが見つかりません。PC側でもう一度QRコードを発行してください。
                  </div>
                ) : null}

                {!isUnavailable ? (
                  <>
                    <BarcodeScanner
                      onDetected={submitJan}
                      buttonLabel={status === 'sending' ? '送信中...' : '読み取り開始'}
                      helperText="CDのJANコードを枠内に合わせてください。読み取り後、PC側へ自動送信します。"
                      className={status === 'sending' ? 'pointer-events-none opacity-60' : ''}
                    />
                    <form onSubmit={handleManualSubmit} className="space-y-3 rounded-[22px] border border-slate-200/60 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                      <label className="block text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        手入力
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={manualJan}
                        onChange={(event) => setManualJan(event.target.value)}
                        className={inputClass}
                        placeholder="例: 4988000000000"
                        disabled={status === 'sending'}
                      />
                      <button type="submit" disabled={status === 'sending'} className={`${primaryButtonClass} w-full`}>
                        <ScanBarcode className="h-4 w-4" />
                        PCへ送信
                      </button>
                    </form>
                  </>
                ) : null}
              </div>
            )}

            {status === 'sending' ? (
              <p className="text-center text-sm font-bold text-sky-600 dark:text-sky-300">PCへ送信しています...</p>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
