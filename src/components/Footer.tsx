import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <Image
            src="/branding/daog-eye-mark.png"
            alt="Deutsch-Arabische Ophthalmologische Gesellschaft"
            width={22}
            height={12}
            className="opacity-80"
          />
          <span>AugenFacharzt – Mündliche Prüfung</span>
        </div>
        <span>
          Entwickelt von <span className="font-normal text-foreground">Dr. Abdelhamid Ghunaim</span>
        </span>
      </div>
    </footer>
  );
}
