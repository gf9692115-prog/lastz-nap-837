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
      className={`flex flex-col justify-between gap-4 border-b border-line pb-4 sm:flex-row sm:items-end ${className}`}
    >
      <div className="flex min-w-0 gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 h-10 w-[3px] shrink-0 bg-blood shadow-[0_0_16px_rgba(200,16,46,.8)]"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[9px] tracking-[0.18em] text-acid-300">
              {index}
            </span>
            <span className="h-px w-5 bg-blood/60" aria-hidden="true" />
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ash">
              {eyebrow}
            </span>
          </div>
          <h2 className="mt-1.5 text-balance font-decor text-[24px] font-normal uppercase leading-[1.05] tracking-[0.04em] text-bone sm:text-[28px]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-[12px] leading-relaxed text-ash sm:text-[13px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0 sm:pl-4">{action}</div> : null}
    </div>
  );
}
