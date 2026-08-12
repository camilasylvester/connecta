import { instagramUrl } from "@/lib/instagram";

/** Clickable Instagram handle that opens the public profile. */
export function InstagramLink({
  handle,
  className = "",
  children,
}: {
  handle: string | null | undefined;
  className?: string;
  children?: React.ReactNode;
}) {
  const url = instagramUrl(handle);
  if (!handle) {
    return <span className={className}>{children || "Sin Instagram"}</span>;
  }
  if (!url) {
    return <span className={className}>{children || handle}</span>;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className || "font-semibold text-purple hover:underline"}
      title={`Abrir ${handle} en Instagram`}
    >
      {children || handle}
    </a>
  );
}
