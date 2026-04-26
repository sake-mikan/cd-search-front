'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Tag } from 'lucide-react';

export default function AlbumCard({ album }) {
  return (
    <Link 
      href={`/albums/${album.id}`}
      className="group bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:shadow-md transition-all hover:-translate-y-1"
    >
      <div className="aspect-square relative bg-slate-100 dark:bg-slate-900">
        {album.cover_image_url ? (
          <Image
            src={album.cover_image_url}
            alt={album.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
        )}
        {album.edition && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600/90 text-white text-[10px] font-bold rounded">
            {album.edition}
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {album.title}
        </h3>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Tag className="w-3 h-3 shrink-0" />
            <span className="truncate">{album.album_artist || 'V.A.'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3 h-3 shrink-0" />
            <span>{album.release_date}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}