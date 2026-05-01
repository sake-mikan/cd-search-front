"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, X } from 'lucide-react';
import { outlineButtonClass } from '@/utils/uiTheme';

export default function BarcodeScanner({
  onDetected,
  buttonLabel = 'CDのバーコードを読取',
  helperText = 'CDのバーコード(JANコード)を枠内に合わせてください',
  className = '',
  buttonClassName = '',
}) {
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const controlsRef = useRef(null);
  const requestRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleSuccess = useCallback(
    (code) => {
      if (navigator.vibrate) {
        try {
          navigator.vibrate(200);
        } catch (e) {
          // Ignore vibrate errors
        }
      }
      stopCamera();
      onDetected(code);
    },
    [onDetected, stopCamera]
  );

  useEffect(() => {
    if (!isScanning) return;

    let isActive = true;

    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const videoEl = videoRef.current;

        if (videoEl) {
          videoEl.srcObject = stream;
          // Required for iOS Safari
          videoEl.setAttribute('playsinline', 'true');
          await videoEl.play();
        }

        if ('BarcodeDetector' in window) {
          const barcodeDetector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8'],
          });

          const detectLoop = async () => {
            if (!isActive || !videoEl || videoEl.readyState !== videoEl.HAVE_ENOUGH_DATA) {
              if (isActive) requestRef.current = requestAnimationFrame(detectLoop);
              return;
            }
            try {
              const barcodes = await barcodeDetector.detect(videoEl);
              const ean = barcodes.find((b) => b.format === 'ean_13' || b.format === 'ean_8');
              if (ean) {
                handleSuccess(ean.rawValue);
                return;
              }
              if (
                barcodes.length > 0 &&
                barcodes[0].rawValue.length >= 12 &&
                barcodes[0].rawValue.length <= 13
              ) {
                handleSuccess(barcodes[0].rawValue);
                return;
              }
            } catch (err) {
              // Ignore detect errors
            }
            if (isActive) requestRef.current = requestAnimationFrame(detectLoop);
          };
          detectLoop();
        } else {
          // Fallback to ZXing
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          const codeReader = new BrowserMultiFormatReader();

          if (!isActive) return;

          codeReader.decodeFromVideoElement(videoEl, (result, err, controls) => {
            if (!isActive && controls) {
              controls.stop();
              return;
            }
            if (controls) {
              controlsRef.current = controls;
            }
            if (result) {
              const text = result.getText();
              // Basic JAN check
              if (text && /^\d{8,13}$/.test(text)) {
                handleSuccess(text);
              }
            }
          });
        }
      } catch (err) {
        console.error('Failed to start camera:', err);
        alert('カメラの起動に失敗しました。カメラのアクセス許可を確認してください。');
        stopCamera();
      }
    };

    startScanner();

    return () => {
      isActive = false;
      stopCamera();
    };
  }, [isScanning, handleSuccess, stopCamera]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsScanning(true)}
        className={buttonClassName || `${outlineButtonClass} w-full py-4 text-base shadow-sm font-bold bg-white dark:bg-slate-900 border-2 ${className}`}
      >
        <Camera className="h-6 w-6" />
        <span>{buttonLabel}</span>
      </button>

      {isScanning && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black/90 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-4 z-10">
            <div className="text-white font-bold">バーコードスキャン</div>
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="閉じる"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              muted
            />
            {/* 照準線ガイド */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] max-w-sm aspect-video border-2 border-white/50 rounded-xl relative overflow-hidden shadow-[0_0_0_4000px_rgba(0,0,0,0.6)]">
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-red-500/80 shadow-[0_0_12px_rgba(239,68,68,1)] animate-pulse" />
              </div>
            </div>
          </div>

          <div className="h-28 flex items-center justify-center text-white/80 text-sm px-6 text-center pb-8 z-10 bg-gradient-to-t from-black/80 to-transparent">
            {helperText}
          </div>
        </div>
      )}
    </>
  );
}
