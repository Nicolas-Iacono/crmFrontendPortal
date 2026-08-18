"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  url: string;
  title: string;
  /** `full` muestra texto; `icon` solo los círculos. */
  variant?: "full" | "icon";
};

const btnClass =
  "w-10 h-10 rounded-full border-2 border-outline-variant/30 bg-white hover:bg-surface-container-high flex items-center justify-center cursor-pointer transition-colors shadow-sm";

export default function SharePropertyButton({ url, title, variant = "full" }: Props) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiá el enlace de la propiedad:", url);
    }
  };

  const shareNative = async () => {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title, url, text: title });
        return;
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
    }
    setMenuOpen((v) => !v);
  };

  const waHref = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;

  const copyBtn = (
    <button
      type="button"
      onClick={copyUrl}
      title={copied ? "Enlace copiado" : "Copiar enlace"}
      aria-label={copied ? "Enlace copiado" : "Copiar enlace"}
      className={variant === "icon" ? btnClass : `${btnClass} sm:w-auto sm:px-4 sm:gap-2 sm:rounded-xl`}
    >
      <span className="material-symbols-outlined text-[22px] text-on-surface">
        {copied ? "check" : "content_copy"}
      </span>
      {variant === "full" && (
        <span className="hidden sm:inline text-sm font-bold">{copied ? "Copiado" : "Copiar"}</span>
      )}
    </button>
  );

  const shareBtn = (
    <button
      type="button"
      onClick={shareNative}
      title="Compartir"
      aria-label="Compartir por WhatsApp, email u otras apps"
      className={variant === "icon" ? btnClass : `${btnClass} sm:w-auto sm:px-4 sm:gap-2 sm:rounded-xl`}
    >
      <span className="material-symbols-outlined text-[22px] text-on-surface">share</span>
      {variant === "full" && <span className="hidden sm:inline text-sm font-bold">Compartir</span>}
    </button>
  );

  return (
    <div className={`relative flex items-center gap-2 ${variant === "full" ? "w-full" : "shrink-0"}`} ref={menuRef}>
      {copyBtn}
      {shareBtn}

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 z-20 min-w-48 bg-white rounded-xl shadow-lg border border-outline-variant/20 overflow-hidden py-1">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-lg text-green-600">chat</span>
            WhatsApp
          </a>
          <a
            href={mailHref}
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-lg text-primary">mail</span>
            Email
          </a>
        </div>
      )}
    </div>
  );
}
