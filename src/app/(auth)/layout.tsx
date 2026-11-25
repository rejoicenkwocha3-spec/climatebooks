import { Logo } from "@/components/Logo";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-8"><Logo /></div>
      <div className="card w-full max-w-md p-7">{children}</div>
      <p className="mt-8 text-sm text-charcoal/60">© 2026 ClimateBooks</p>
    </div>
  );
}
