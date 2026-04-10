const SITE_NAME = 'DISC MASTER';
const SITE_DOMAIN = 'cdinfo-master.com';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
      <p className="font-medium tracking-[0.08em] text-gray-600 dark:text-gray-300">
        &copy; {year} {SITE_NAME}
      </p>
      <p className="mt-1">{SITE_DOMAIN}</p>
    </footer>
  );
}
