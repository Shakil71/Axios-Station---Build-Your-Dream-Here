import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <ShieldAlert className="h-12 w-12 text-warning" />
      <h1 className="mt-6 text-2xl font-bold">You don&apos;t have access to this area</h1>
      <p className="mt-2 max-w-md text-muted">Your role doesn&apos;t include permission for this module. Ask a Super Admin if you need access.</p>
      <Link href="/admin" className={buttonVariants({ variant: "secondary", className: "mt-8" })}>Back to dashboard</Link>
    </div>
  );
}
