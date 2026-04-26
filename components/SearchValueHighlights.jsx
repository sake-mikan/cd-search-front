import React from 'react';

export default function SearchValueHighlights({ text = '', keyword = '' }) {
  if (!keyword || !text) return <>{text || '-'}</>;

  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escapedKeyword})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={i} className="bg-sky-100 text-sky-900 dark:bg-sky-500/30 dark:text-sky-100 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
