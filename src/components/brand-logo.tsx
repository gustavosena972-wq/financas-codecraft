import Link from "next/link";

export function BrandLogo({
  href = "/",
  tone = "dark",
}: {
  href?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link href={href} className={`brand ${tone}`}>
      <span className="mark">FC</span>
      <span className="brand-text">
        <span className="brand-name">Finanças CodeCraft</span>
        <span className="brand-sub">CodeCraft Solutions</span>
      </span>
    </Link>
  );
}
