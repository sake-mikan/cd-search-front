import { Link } from 'react-router-dom';
import DiscMasterLogo from './DiscMasterLogo';

export default function SiteBrandHeader({ className = '', actions = null }) {
  return (
    <div className={['-mt-1 mb-3 space-y-2 sm:-mt-2 sm:mb-4 sm:space-y-0', className].filter(Boolean).join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <Link
          to="/"
          className="inline-flex max-w-full min-w-0 transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
          aria-label={'\u30c8\u30c3\u30d7\u30da\u30fc\u30b8\u3078\u623b\u308b'}
        >
          <DiscMasterLogo />
        </Link>
        {actions ? <div className="hidden shrink-0 flex-wrap items-center justify-end gap-2 self-start sm:flex">{actions}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 sm:hidden">{actions}</div> : null}
    </div>
  );
}
