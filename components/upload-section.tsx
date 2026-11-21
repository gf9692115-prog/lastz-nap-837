import { AlertTriangle, ScanEye, ShieldCheck } from "lucide-react";

import { NAP_RULES, SITE } from "@/lib/constants";

import { SectionHeading } from "./section-heading";
import { UploadZone } from "./upload-zone";

interface UploadSectionProps {
  onUploaded?: () => void | Promise<void>;
}

export function UploadSection({ onUploaded }: UploadSectionProps) {
  return (
    <section id="upload" className="scroll-mt-24 pt-12 sm:pt-16">
      <SectionHeading
        index="01"
        eyebrow="Capture / Analyze"
        title="Upload a report. Get a verdict."
        description="AI extracts the facts from multilingual screenshots; a server-side ruleset makes the final call. Only Server 837 is scored, and attacker/victim sides are never reversed."
        action={
          <span className="inline-flex items-center gap-2 rounded-sm border border-white/10 bg-white/[0.035] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-acid shadow-[0_0_8px_rgba(215,255,63,.7)]" />
            AI Vision / Rule Verified
          </span>
        }
      />

      <div className="mt-6 flex flex-col overflow-hidden rounded-sm border border-white/10 bg-void-900/75 shadow-panel backdrop-blur-sm lg:grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative order-2 border-t border-white/[0.08] p-5 sm:p-7 lg:order-1 lg:border-r lg:border-t-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 top-20 h-56 w-56 rounded-full bg-acid/[0.055] blur-3xl"
          />
          <div className="relative">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <ScanEye className="h-3.5 w-3.5 text-acid" />
              Recognition protocol
            </div>
            <p className="mt-3 max-w-md text-[13px] leading-7 text-zinc-300">
              Only the{" "}
              <span className="text-white">right-side VS attacker</span>, the{" "}
              <span className="text-white">bounty-card plunderer</span>, or the{" "}
              <span className="text-white">trade-truck defense-log attacker</span>{" "}
              is treated as the suspect. The left-side uploader is never scored.
            </p>

            <div className="mt-6 space-y-0 border-t border-white/[0.08]">
              {NAP_RULES.map((rule) => (
                <div
                  key={rule.index}
                  className="group flex gap-4 border-b border-white/[0.08] py-4"
                >
                  <span className="pt-0.5 font-mono text-[10px] tracking-wider text-acid/70">
                    {rule.index}
                  </span>
                  <div>
                    <h3 className="font-display text-[14px] font-semibold tracking-wide text-zinc-100">
                      {rule.title}
                    </h3>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                      {rule.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-sm border border-acid/15 bg-acid/[0.045] px-3 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
              <p className="text-[11px] leading-relaxed text-zinc-400">
                <span className="font-medium text-zinc-200">
                  Server {SITE.server} only.
                </span>{" "}
                A prefix such as{" "}
                <span className="font-mono text-zinc-300">#838</span> means the
                player is from another server; cross-server actions do not count
                toward this server&apos;s NAP.
              </p>
            </div>

            <div className="mt-3 flex items-start gap-2.5 px-1">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" />
              <p className="text-[10px] leading-relaxed text-zinc-600">
                If a screenshot is blurred, obscured, or missing a readable
                timestamp, the system rejects it instead of guessing.
              </p>
            </div>
          </div>
        </div>

        <div className="relative order-1 p-4 sm:p-6 lg:order-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                Evidence intake
              </div>
              <h3 className="mt-1 font-display text-[16px] font-semibold text-white">
                Report screenshot upload
              </h3>
            </div>
            <span className="rounded-sm border border-white/10 px-2 py-1 font-mono text-[9px] tracking-[0.12em] text-zinc-500">
              01 IMAGE / 1 RECORD
            </span>
          </div>
          <UploadZone onUploaded={onUploaded} />
        </div>
      </div>
    </section>
  );
}
