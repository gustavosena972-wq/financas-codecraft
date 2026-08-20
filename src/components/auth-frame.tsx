import Link from "next/link";

export function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-panel grid place-items-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8 text-white">
          <span className="mark">FC</span>
          <span className="font-semibold">Finanças CodeCraft</span>
        </Link>
        <div className="card p-7">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
