import { requireAdminUser } from "@/lib/guards";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav user={user} />
      <main className="animate-fade-in mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}
