'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QrCode, RefreshCw, Smartphone, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  consumeScannerSession,
  createScannerSession,
  fetchScannerSession,
} from '@/lib/api';
import { outlineButtonClass, primaryButtonClass, secondaryButtonClass } from '@/utils/uiTheme';

function formatExpiresAt(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

export default function SmartphoneScannerPanel({ onJanDetected, buttonClassName = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isReceived, setIsReceived] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const intervalRef = useRef(null);
  const handledJanRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetPanel = useCallback(() => {
    stopPolling();
    handledJanRef.current = false;
    setSession(null);
    setStatusText('');
    setError('');
    setIsReceived(false);
  }, [stopPolling]);

  useEffect(() => {
    setIsMounted(true);

    return stopPolling;
  }, [stopPolling]);

  const handleScannedSession = useCallback(async (payload) => {
    if (handledJanRef.current) return;
    const janCode = String(payload?.jan_code ?? '').trim();
    if (janCode === '') return;

    handledJanRef.current = true;
    stopPolling();
    setIsReceived(true);
    setStatusText('JANコードを受信しました。検索しています...');

    await onJanDetected(janCode);

    try {
      await consumeScannerSession(payload.session_id);
    } catch {
      // 検索導線を優先するため、消費済み更新の失敗は画面上では扱わない。
    }

    setIsOpen(false);
  }, [onJanDetected, stopPolling]);

  const pollSession = useCallback(async (sessionId) => {
    try {
      const payload = await fetchScannerSession(sessionId);
      if (payload?.status === 'scanned') {
        await handleScannedSession(payload);
        return;
      }
      if (payload?.status === 'expired') {
        stopPolling();
        setStatusText('期限切れです。もう一度QRコードを発行してください。');
        setError('スキャン用QRコードの期限が切れました。');
        return;
      }
      if (payload?.status === 'waiting') {
        setStatusText('バーコード読み取り待機中...');
      }
    } catch (err) {
      stopPolling();
      setError(getErrorMessage(err, 'セッション状態の確認に失敗しました。'));
      setStatusText('');
    }
  }, [handleScannedSession, stopPolling]);

  const startSession = useCallback(async () => {
    resetPanel();
    setIsOpen(true);
    setIsCreating(true);
    setStatusText('スマホの接続を待っています...');

    try {
      const payload = await createScannerSession();
      setSession(payload);
      setStatusText('スマホの接続を待っています...');

      intervalRef.current = setInterval(() => {
        pollSession(payload.session_id);
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err, 'スキャンセッションを作成できませんでした。'));
      setStatusText('');
    } finally {
      setIsCreating(false);
    }
  }, [pollSession, resetPanel]);

  const closePanel = () => {
    setIsOpen(false);
    resetPanel();
  };

  const modal = isOpen ? (
    <div className="fixed inset-0 z-[9998] overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center">
        <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/15 bg-white/95 p-5 shadow-2xl dark:bg-slate-950/95">
          <button
            type="button"
            onClick={closePanel}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/15"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-5 pr-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
              <QrCode className="h-3.5 w-3.5" />
              SMARTPHONE JAN SCANNER
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">スマホをJANスキャナとして使う</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                QRコードをスマホで読み取ると、スマホのカメラでCDのJANコードをスキャンできます。
                読み取った結果はこのPC画面に自動で表示されます。
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[20px] border border-slate-200 bg-slate-50/80 p-4 text-center dark:border-white/10 dark:bg-white/5">
            {isCreating ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-300">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <p className="text-sm font-bold">QRコードを発行しています...</p>
              </div>
            ) : session?.qr_url ? (
              <div className="space-y-4">
                <div className="mx-auto inline-flex rounded-[18px] bg-white p-4 shadow-sm">
                  <QRCodeSVG value={session.qr_url} size={220} level="M" includeMargin />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{statusText}</p>
                  {session.expires_at ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      有効期限: {formatExpiresAt(session.expires_at)}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="py-10 text-sm text-slate-500 dark:text-slate-300">QRコードを発行してください。</p>
            )}
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {error ? (
              <button type="button" onClick={startSession} className={primaryButtonClass}>
                <RefreshCw className="h-4 w-4" />
                QRコードを再発行
              </button>
            ) : null}
            <button type="button" onClick={closePanel} className={isReceived ? primaryButtonClass : secondaryButtonClass}>
              {isReceived ? '閉じる' : 'キャンセル'}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={startSession}
        className={buttonClassName || `${outlineButtonClass} w-full md:w-auto`}
      >
        <Smartphone className="h-4 w-4" />
        スマホでスキャンしてこのPCに表示
      </button>

      {isMounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
