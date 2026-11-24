import Image from "next/image";

export function AuthCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-12">
      <div className="bg-grid mask-radial absolute inset-0 opacity-70" aria-hidden />
      <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-brand/25 blur-[110px]" aria-hidden />
      <div className="glass relative w-full max-w-md rounded-3xl p-8 shadow-card">
        <Image src="/images/brand/axios-mark.png" alt="Axios Station" width={512} height={258} className="h-9 w-auto" priority />
        <h1 className="mt-8 text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
