import { planLabel, productsFor, type ProductAudience } from "@/lib/products";
import Link from "next/link";

export function ProductGrid({ audience }: { audience: ProductAudience }) {
  const items = productsFor(audience);
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const inner = (
          <>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{item.name}</h3>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gold">{planLabel(item.plan)}</span>
            </div>
            <p className="text-sm text-muted mt-2">{item.does}</p>
          </>
        );
        return item.href ? (
          <Link key={item.id} href={item.href} className="card p-5 block hover:ring-1 hover:ring-gold/40">
            {inner}
          </Link>
        ) : (
          <article key={item.id} className="card p-5">
            {inner}
          </article>
        );
      })}
    </div>
  );
}
