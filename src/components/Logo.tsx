import Link from "next/link";
import { LogoWordmark } from "@/components/LogoWordmark";

export function Logo({
  href = "/",
  className = "",
  "aria-label": ariaLabel,
}: {
  href?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center text-[22px] ${className}`}
      aria-label={ariaLabel}
    >
      <LogoWordmark className="h-[0.86em] w-auto" />
    </Link>
  );
}
