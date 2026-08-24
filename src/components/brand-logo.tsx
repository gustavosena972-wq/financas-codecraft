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
      <span className="brand-mark" aria-hidden />
      <span>
        <span className="brand-name block">CodeCraft Gestão</span>
        <span className="brand-sub">CodeCraft Solutions</span>
      </span>
    </Link>
  );
}
