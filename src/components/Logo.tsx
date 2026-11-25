import Link from "next/link";
export function LogoMark({ size = 36 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.jpg" alt="ClimateBooks logo" width={size} height={size} style={{ width: size, height: size, objectFit: "cover" }} className="rounded-lg" />;
}
export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-display text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-emerald"}`}>ClimateBooks</span>
    </Link>
  );
}
