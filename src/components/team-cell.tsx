export function TeamCell({ name, crestUrl }: { name: string; crestUrl?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      {crestUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={crestUrl} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
      ) : null}
      <span>{name}</span>
    </div>
  );
}
