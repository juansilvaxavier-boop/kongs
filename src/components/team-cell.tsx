import Image from "next/image";

export function TeamCell({ name, crestUrl }: { name: string; crestUrl?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      {crestUrl ? (
        <span className="relative h-5 w-5 shrink-0">
          <Image src={crestUrl} alt="" fill loading="eager" sizes="20px" className="rounded-full object-cover" />
        </span>
      ) : null}
      <span>{name}</span>
    </div>
  );
}
