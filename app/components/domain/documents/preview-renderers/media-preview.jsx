"use client";

/**
 * @param {{ src: string }} props
 */
export function VideoPreview({ src }) {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center bg-black p-4">
      <video src={src} controls className="max-h-[70vh] max-w-full rounded-lg" playsInline>
        <track kind="captions" />
      </video>
    </div>
  );
}

/**
 * @param {{ src: string }} props
 */
export function AudioPreview({ src }) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4 p-8">
      <p className="text-caption text-muted-foreground">Audio preview</p>
      <audio src={src} controls className="w-full max-w-md">
        <track kind="captions" label="No captions available" />
      </audio>
    </div>
  );
}
