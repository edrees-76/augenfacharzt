"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Sparkles, Award, Eye } from "lucide-react";

interface CreatorModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreatorModal({ open, onClose }: CreatorModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="creator-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in">
        {/* Subtle Decorative Top Glow */}
        <div className="h-2 w-full bg-gradient-to-r from-accent/50 via-accent to-accent/50" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="absolute right-4 top-5 rounded-full p-1.5 text-muted hover:bg-surface-elevated hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="p-6 text-center">
          {/* Logo Showcase with Gold/Cyan Glow and High-Resolution Full Display */}
          <div className="relative mx-auto mb-5 flex w-full items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-accent/25 blur-2xl" />
            <div className="relative h-40 w-64 overflow-hidden rounded-2xl border-2 border-accent/50 bg-[#0a1622] p-3 shadow-2xl transition-transform hover:scale-[1.02]">
              <Image
                src="/branding/dr-ghunaim-full.png"
                alt="Dr. Abdelhamid Ghunaim – Ophthalmology"
                fill
                priority
                sizes="256px"
                className="object-contain p-2"
              />
            </div>
          </div>

          {/* Title & Credentials */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-0.5 text-xs font-medium text-accent mb-2">
            <Sparkles className="size-3" />
            <span>Medizinisches Konzept & Design</span>
          </div>

          <h2 id="creator-dialog-title" className="text-xl font-bold tracking-tight text-foreground">
            Dr. Abdelhamid Ghunaim
          </h2>
          <p className="font-mono text-xs uppercase tracking-wider text-muted mt-0.5">
            Ophthalmology / Augenheilkunde
          </p>

          {/* Bio / Description */}
          <div className="mt-4 rounded-xl border border-border/70 bg-surface-elevated/40 p-4 text-left text-xs leading-relaxed text-foreground/90 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Eye className="size-4 text-accent shrink-0 mt-0.5" />
              <p>
                Konzeption und wissenschaftliche Strukturierung der Vorbereitungsplattform für die
                mündliche <strong>Facharztprüfung Augenheilkunde</strong> in Deutschland.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Award className="size-4 text-accent shrink-0 mt-0.5" />
              <p>
                Entwickelt nach den Richtlinien der Landesärztekammern und den aktuellen
                Leitlinien der Deutschen Ophthalmologischen Gesellschaft (DOG / BVA).
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-[var(--radius-button)] bg-accent px-4 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-accent-hover active:scale-[0.98] cursor-pointer"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
