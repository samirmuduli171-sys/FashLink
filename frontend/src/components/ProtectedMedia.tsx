"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  type: "image" | "video";
  alt?: string;
  className?: string;
  controls?: boolean;
  muted?: boolean;
  protect?: boolean;
};

export default function ProtectedMedia({
  src,
  type,
  alt = "",
  className = "",
  controls = false,
  muted = false,
  protect = true,
}: Props) {
  const [hidden, setHidden] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!protect) return;

    const hide = () => setHidden(true);
    const show = () => setHidden(false);
    const hideFor = (ms: number) => {
      setHidden(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setHidden(false), ms);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        k === "printscreen" ||
        (e.metaKey && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && k === "p")
      ) {
        hideFor(2000);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        hideFor(2000);
        navigator.clipboard?.writeText("").catch(() => {});
      }
    };
    const onVisibility = () => {
      if (document.hidden) hide();
      else show();
    };

    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [protect]);

  const block = (e: React.SyntheticEvent) => {
    if (protect) e.preventDefault();
  };

  return (
    <div
      className={`pm-root relative overflow-hidden ${protect ? "select-none" : ""}`}
      onContextMenu={block}
      onDragStart={block}
    >
      <style>{`@media print { .pm-root { visibility: hidden !important; } }`}</style>

      {type === "image" ? (
        <img
          src={src}
          alt={alt}
          draggable={!protect}
          className={`${protect ? "pointer-events-none" : ""} ${className}`}
        />
      ) : (
        <video
          src={src}
          className={className}
          controls={controls}
          muted={muted}
          controlsList={protect ? "nodownload noremoteplayback" : undefined}
          disablePictureInPicture={protect}
          onContextMenu={block}
        />
      )}

      {protect && hidden && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-xs text-muted">
          Protected content
        </div>
      )}
    </div>
  );
}
