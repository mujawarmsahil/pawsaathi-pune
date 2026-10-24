import { useState } from 'react';

type ProfileImageProps = {
  src?: string | null;
  name: string;
  className?: string;
  fallbackSrc?: string;
  loading?: 'eager' | 'lazy';
};

export function ProfileImage({
  src,
  name,
  className,
  fallbackSrc,
  loading = 'lazy',
}: ProfileImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const pictureSrc =
    src && failedSrc !== src ? src : fallbackSrc && failedSrc !== fallbackSrc ? fallbackSrc : null;

  if (!pictureSrc) {
    return (
      <span
        className={['profile-placeholder', className].filter(Boolean).join(' ')}
        role="img"
        aria-label={`${name} profile picture not uploaded`}
      >
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="22" r="11" />
          <path d="M8 64c0-13.3 10.7-24 24-24s24 10.7 24 24Z" />
        </svg>
      </span>
    );
  }

  const isLoaded = loadedSrc === pictureSrc;
  return (
    <span className={['profile-image', className].filter(Boolean).join(' ')} aria-busy={!isLoaded}>
      {!isLoaded && <span className="image-skeleton" aria-hidden="true" />}
      <img
        className={
          isLoaded ? 'profile-image-content' : 'profile-image-content profile-image-pending'
        }
        src={pictureSrc}
        alt={`${name} profile picture`}
        loading={loading}
        onLoad={() => setLoadedSrc(pictureSrc)}
        onError={() => setFailedSrc(pictureSrc)}
      />
    </span>
  );
}
