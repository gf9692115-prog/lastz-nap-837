import { ArrowUpRight } from "lucide-react";

import { LogoMark } from "./logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line-strong bg-[#0a0606]/95 backdrop-blur-xl">
      <div
        aria-hidden="true"
        className="h-[2px] w-full bg-gradient-to-r from-blood via-acid to-blood"
      />
      <div className="mx-auto flex h-[66px] w-full max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="#top"
          className="group flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/80"
          aria-label="NAP War Report home"
        >
          <span className="relative text-acid drop-shadow-[0_0_12px_rgba(242,169,0,0.25)]">
            <LogoMark className="h-9 w-9 transition-transform duration-500 group-hover:rotate-45" />
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-blood shadow-[0_0_12px_rgba(200,16,46,.95)]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-[15px] font-bold uppercase leading-none tracking-[0.12em] text-bone">
              NAP<span className="text-acid">//</span>837
            </span>
            <span className="mt-1.5 block truncate font-mono text-[9px] uppercase leading-none tracking-[0.22em] text-ash">
              Last Z · War Report
            </span>
          </span>
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 md:flex"
        >
          <a
            href="#leaderboard"
            className="text-[12px] font-medium tracking-wide text-zinc-400 transition-colors hover:text-acid-300"
          >
            Leaderboard
          </a>
          <a
            href="#evidence"
            className="text-[12px] font-medium tracking-wide text-zinc-400 transition-colors hover:text-acid-300"
          >
            Evidence
          </a>
          <span className="h-4 w-px bg-line-strong" aria-hidden="true" />
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ash">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blood opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blood" />
            </span>
            Server online
          </span>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-sm border border-line-strong bg-black/30 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.15em] text-ash sm:inline-flex">
            SVR <span className="ml-1 text-acid-300">837</span>
          </span>
          <a
            href="#upload"
            className="group inline-flex h-9 items-center gap-2 rounded-sm bg-acid-300 px-3.5 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a0d08] transition-colors hover:bg-acid sm:px-4"
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
