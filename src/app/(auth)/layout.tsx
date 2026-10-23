import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-end p-4">
        <ThemeToggle />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-12">
        <div className="animate-fade-in-up mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/branding/daog-eye-mark.png"
            alt="Deutsch-Arabische Ophthalmologische Gesellschaft"
            width={66}
            height={36}
            className="opacity-90 transition-opacity hover:opacity-100"
          />
          <div>
            <Link href="/" className="text-xl font-normal tracking-tight text-foreground hover:text-accent transition-colors">
              AugenFacharzt
            </Link>
            <p className="font-mono text-xs text-muted uppercase tracking-wider mt-0.5">
              Mündliche Prüfung – Lernplattform
            </p>
          </div>
        </div>
        <div className="animate-scale-in w-full max-w-md">{children}</div>
      </div>

      <Footer />
    </div>
  );
}
