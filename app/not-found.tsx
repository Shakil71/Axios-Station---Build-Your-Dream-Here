import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4">
      <div className="bg-grid mask-radial absolute inset-0 opacity-70" aria-hidden />
      <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-brand/25 blur-[100px]" aria-hidden />
      <div className="relative text-center">
        <Image src="/images/brand/axios-mark.png" alt="Axios Station" width={512} height={258} className="mx-auto h-10 w-auto" />
        <p className="mt-10 font-display text-8xl font-extrabold text-brand-gradient">404</p>
        <h1 className="mt-4 text-2xl font-bold">This page doesn&apos;t exist</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">The page may have moved or the link may be incorrect.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className={buttonVariants()}>Go home</Link>
          <Link href="/contact" className={buttonVariants({ variant: "secondary" })}>Contact us</Link>
        </div>
      </div>
    </main>
  );
}
