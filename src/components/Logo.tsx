import Link from "next/link";
import { LogoWordmark } from "@/components/LogoWordmark";

export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center text-[22px] ${className}`}>
      <LogoWordmark className="h-[0.86em] w-auto" />
    </Link>
  );
}
