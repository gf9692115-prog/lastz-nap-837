import { ArrowUpRight } from "lucide-react";

import { LogoMark } from "./logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-void-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] w-full max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="#top"
          className="group flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/80"
          aria-label="NAP Watch home"
        >
          <span className="relative text-acid">
            <LogoMark className="h-9 w-9 transition-transform duration-500 group-hover:rotate-45" />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-acid shadow-[0_0_10px_rgba(215,255,63,.9)]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-[15px] font-bold uppercase leading-none tracking-[0.12em] text-white">
              NAP<span className="text-acid">//</span>837
            </span>
            <span className="mt-1.5 block truncate font-mono text-[9px] uppercase leading-none tracking-[0.22em] text-zinc-500">
              Last Z · Enforcement
            </span>
          </span>
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 md:flex"
        >
          <a
            href="#leaderboard"
            className="text-[12px] font-medium tracking-wide text-zinc-400 transition-colors hover:text-white"
          >
            Leaderboard
          </a>
          <a
            href="#evidence"
            className="text-[12px] font-medium tracking-wide text-zinc-400 transition-colors hover:text-white"
          >
            Evidence
          </a>
          <span className="h-4 w-px bg-white/10" aria-hidden="true" />
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acid opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-acid" />
            </span>
            Server online
          </span>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-sm border border-white/10 bg-white/[0.035] px-2.5 py-1.5 font-mono text-[10px] tracking-[0.15em] text-zinc-300 sm:inline-flex">
            SVR <span className="ml-1 text-acid">837</span>
          </span>
          <a
            href="#upload"
            className="group inline-flex h-9 items-center gap-2 rounded-sm bg-acid px-3.5 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-void-950 transition-colors hover:bg-acid-300 sm:px-4"
          >
            Upload Report
            <ArrowUpRight
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        </div>
      </div>
    </header>
  );
}
