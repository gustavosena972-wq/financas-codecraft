import { BrandLogo } from "@/components/brand-logo";

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
    <div className="land min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BrandLogo tone="dark" />
        </div>
        <div className="card p-7">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
