export default function DiscMasterLogo({ compact = false }) {
  const iconSizeClass = compact ? 'h-12 w-12' : 'h-14 w-14';
  const wordmarkClass = compact ? 'text-[1.78rem]' : 'text-[2.18rem]';
  const straplineClass = compact ? 'text-[10px]' : 'text-[11px]';

  return (
    <div className="inline-flex items-center gap-3 sm:gap-4">
      <span
        className={`relative inline-flex ${iconSizeClass} shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] bg-[linear-gradient(155deg,rgba(125,211,252,0.52),rgba(255,255,255,0.95)_26%,rgba(191,219,254,0.4)_56%,rgba(51,65,85,0.62)_100%)] p-[1px] shadow-[0_18px_40px_-22px_rgba(14,165,233,0.32)] dark:bg-[linear-gradient(155deg,rgba(56,189,248,0.28),rgba(148,163,184,0.14)_26%,rgba(14,165,233,0.2)_54%,rgba(2,6,23,0.92)_100%)] dark:shadow-[0_18px_44px_-24px_rgba(14,165,233,0.42)]`}
        aria-hidden="true"
      >
        <span className="absolute inset-[1px] rounded-[1.28rem] bg-[linear-gradient(145deg,rgba(241,245,249,0.98),rgba(186,230,253,0.84)_28%,rgba(51,65,85,0.9)_88%)] dark:bg-[linear-gradient(145deg,rgba(148,163,184,0.24),rgba(14,165,233,0.18)_30%,rgba(2,6,23,0.96)_88%)]" />
        <span className="absolute inset-[1px] rounded-[1.28rem] ring-1 ring-white/45 dark:ring-sky-300/10" />
        <span className="pointer-events-none absolute inset-[1px] rounded-[1.28rem] bg-[radial-gradient(circle_at_28%_28%,rgba(255,255,255,0.48),transparent_34%)]" />
        <svg viewBox="0 0 64 64" className="relative z-10 h-[74%] w-[74%]" fill="none" shapeRendering="geometricPrecision">
          <ellipse cx="43" cy="18" rx="10.5" ry="4.25" fill="rgba(125,211,252,0.9)" stroke="rgba(255,255,255,0.86)" strokeWidth="1.4" />
          <path d="M32.5 18v5.4c0 2.35 4.7 4.25 10.5 4.25s10.5-1.9 10.5-4.25V18" stroke="rgba(255,255,255,0.78)" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M32.5 23.4v5.35c0 2.35 4.7 4.25 10.5 4.25s10.5-1.9 10.5-4.25V23.4" stroke="rgba(125,211,252,0.75)" strokeWidth="1.35" strokeLinejoin="round" />
          <path d="M32.5 28.75v5.35c0 2.35 4.7 4.25 10.5 4.25s10.5-1.9 10.5-4.25v-5.35" stroke="rgba(255,255,255,0.62)" strokeWidth="1.3" strokeLinejoin="round" />
          <circle cx="22" cy="39" r="13.25" stroke="rgba(255,255,255,0.98)" strokeWidth="3.1" />
          <circle cx="22" cy="39" r="6.6" stroke="rgba(255,255,255,0.58)" strokeWidth="1.9" />
          <circle cx="22" cy="39" r="2.75" fill="rgba(255,255,255,0.96)" />
          <path d="M31.8 28.5l5.2-5.2" stroke="rgba(125,211,252,0.92)" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M28.6 24.3l4.1-4.1" stroke="rgba(255,255,255,0.74)" strokeWidth="1.55" strokeLinecap="round" />
          <path d="M33.2 31.9l5.4-5.4" stroke="rgba(255,255,255,0.54)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>

      <span className="min-w-0 space-y-0">
        <span className={`hidden font-semibold uppercase tracking-[0.3em] text-sky-600/85 dark:text-sky-300/80 sm:block ${straplineClass}`}>
          Accurate CD knowledge from past to upcoming releases
        </span>
        <span className={`block font-black uppercase tracking-[0.02em] text-slate-950 dark:text-slate-50 ${wordmarkClass}`}>
          <span className="text-slate-950 dark:text-slate-100">DISC</span>
          <span className="bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-500 bg-clip-text text-transparent dark:from-sky-300 dark:via-cyan-300 dark:to-blue-400">
            MASTER
          </span>
        </span>
      </span>
    </div>
  );
}
