import type { ReactNode } from "react";

interface SectionHeadingProps {
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  action,
  className = "",
}: SectionHeadingProps) {
  return (
    <div
      className={`flex flex-col justify-between gap-4 sm:flex-row sm:items-end ${className}`}
    >
      <div>
        <div className="mb-3 flex items-center gap-2.5">
          <span className="font-mono text-[10px] tracking-[0.2em] text-acid">
            {index}
          </span>
          <span className="h-px w-6 bg-acid/50" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            {eyebrow}
          </span>
        </div>
        <h2 className="text-balance font-display text-[25px] font-bold leading-tight tracking-[-0.02em] text-white sm:text-[32px]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-zinc-400 sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
