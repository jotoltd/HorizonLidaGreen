export function Logo({ variant = "light" }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/logo.png" alt="Horizon Lida Green Ltd." className="h-10 w-auto" />
  );
  if (variant === "dark") {
    return (
      <div className="inline-flex items-center rounded-lg bg-white/95 px-3 py-2 shadow-sm">
        {img}
      </div>
    );
  }
  return img;
}
