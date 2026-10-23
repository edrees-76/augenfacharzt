"use client";

import { useState } from "react";
import Image from "next/image";
import { CreatorModal } from "./CreatorModal";

export function Footer() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-border bg-background py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-left">
          {/* Platform & Institution */}
          <div className="flex items-center gap-2.5">
            <div className="relative size-6 shrink-0 overflow-hidden rounded-full border border-border/80 bg-surface-elevated flex items-center justify-center p-0.5">
              <Image
                src="/branding/daog-eye-mark.png"
                alt="DAOG"
                width={20}
                height={11}
                className="opacity-90"
              />
            </div>
            <span className="font-medium text-foreground/80">
              AugenFacharzt – Mündliche Prüfung
            </span>
          </div>

          {/* Designer / Medical Architect Badge */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            title="Klicken für Details über Konzept & Entwicklung"
            className="group flex items-center gap-2.5 rounded-full border border-border/80 bg-surface-elevated/40 px-3 py-1.5 text-xs text-muted transition-all duration-200 hover:border-accent/60 hover:bg-surface-elevated hover:text-foreground cursor-pointer shadow-xs"
          >
            <span className="relative flex size-6 shrink-0 overflow-hidden rounded-full border border-accent/40 bg-[#0b1622] shadow-xs transition-transform group-hover:scale-105">
              <Image
                src="/branding/dr-ghunaim-logo.jpg"
                alt="Dr. Abdelhamid Ghunaim"
                fill
                sizes="24px"
                className="object-cover"
              />
            </span>
            <span className="text-left leading-tight">
              <span className="block text-[10px] text-muted">Konzept & Entwicklung</span>
              <span className="font-medium text-foreground transition-colors group-hover:text-accent">
                Dr. Abdelhamid Ghunaim
              </span>
            </span>
          </button>
        </div>
      </footer>

      {/* Creator Profile Modal */}
      <CreatorModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
