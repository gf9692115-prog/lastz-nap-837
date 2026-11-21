"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { getPublicSupabaseConfig } from "@/lib/client/config";
import {
  allianceBadge,
  formatBattleTimestamp,
  playerNameWithoutAlliance,
  reportTypeLabel,
} from "@/lib/format";
import type { AdminApiResponse, AdminRecord } from "@/lib/types";

interface AdminDialogProps {
  onClose: () => void;
  onRecordsChanged: () => void | Promise<void>;
}

async function callAdmin(
  token: string,
  body: Record<string, unknown>,
): Promise<AdminApiResponse> {
  const { key, adminUrl } = getPublicSupabaseConfig();
  if (!key || !adminUrl) {
    return {
      ok: false,
      code: "CONFIGURATION_ERROR",
      message: "The admin service is not configured for this build.",
    };
  }

  try {
    const response = await fetch(adminUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        "x-admin-token": token,
      },
      body: JSON.stringify(body),
    });

    let payload: AdminApiResponse | null = null;
    try {
      payload = (await response.json()) as AdminApiResponse;
    } catch {
      // Gateway errors do not always return JSON.
    }

    if (
      payload &&
      (typeof payload.ok === "boolean" || typeof payload.message === "string")
    ) {
      return payload;
    }

    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: `Admin request failed (HTTP ${response.status}).`,
    };
  } catch {
    return {
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Could not reach the admin service. Check your connection.",
    };
  }
}

export function AdminDialog({
  onClose,
  onRecordsChanged,
}: AdminDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    inputRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  async function handleUnlock(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const candidate = token.trim();
    if (!candidate || loading) return;

    setLoading(true);
    setError(null);
    setNotice(null);

    const result = await callAdmin(candidate, { action: "list" });
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? "Admin verification failed.");
      return;
    }

    setToken(candidate);
    setUnlocked(true);
    setRecords(result.records ?? []);
  }

  async function handleDelete(id: string): Promise<void> {
    if (deletingId) return;

    setDeletingId(id);
    setError(null);
    setNotice(null);

    const result = await callAdmin(token, { action: "delete", id });

    if (!result.ok) {
      setError(result.message ?? "Could not delete this record.");
      if (result.code === "UNAUTHORIZED") {
        setUnlocked(false);
        setToken("");
        setRecords([]);
        setPendingDelete(null);
      }
      setDeletingId(null);
      return;
    }

    setRecords((current) => current.filter((record) => record.id !== id));
    setPendingDelete(null);
    setDeletingId(null);
    setNotice("Record deleted. The public leaderboard and evidence feed were refreshed.");

    try {
      await onRecordsChanged();
    } catch {
      // The record is already gone; a public refresh can be retried by reloading.
    }
  }

  function lock(): void {
    setUnlocked(false);
    setToken("");
    setRecords([]);
    setPendingDelete(null);
    setError(null);
    setNotice(null);
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dialog-title"
      className="fixed inset-0 z-[90] overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative mx-auto my-4 w-full max-w-3xl overflow-hidden rounded-sm border border-white/15 bg-void-900 shadow-2xl sm:my-8">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-void-900/95 px-4 py-3.5 backdrop-blur sm:px-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-acid">
              <LockKeyhole className="h-3.5 w-3.5" />
              Admin / Moderation
            </div>
            <h2
              id="admin-dialog-title"
              className="mt-1 font-display text-[17px] font-bold text-white sm:text-xl"
            >
              {unlocked ? "Moderation archive" : "Admin access"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin panel"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-white/10 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(92dvh-74px)] overflow-y-auto p-4 sm:p-6">
          {!unlocked ? (
            <div>
              <div className="flex items-start gap-3 rounded-sm border border-white/[0.08] bg-white/[0.025] p-3.5">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
                <div>
                  <p className="text-[13px] font-medium text-zinc-200">
                    Enter the moderation passphrase
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                    The passphrase is verified server-side and held in memory for
                    this tab only. It is never stored in the browser.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUnlock} className="mt-4">
                <label
                  htmlFor="admin-token"
                  className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500"
                >
                  Admin passphrase
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    ref={inputRef}
                    id="admin-token"
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                    placeholder="Enter admin passphrase"
                    className="h-11 min-w-0 flex-1 rounded-sm border border-white/15 bg-black/30 px-3 font-mono text-[12px] text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-acid/60 focus:ring-1 focus:ring-acid/50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !token.trim()}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-acid px-5 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-void-950 transition-colors hover:bg-acid-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <LockKeyhole className="h-4 w-4" />
                    )}
                    {loading ? "Verifying" : "Unlock"}
                  </button>
                </div>
              </form>

              <p className="mt-3 text-[10px] leading-relaxed text-zinc-600">
                Deletion is permanent. It removes the record, its evidence image,
                and its leaderboard count.
              </p>

              {error ? (
                <div className="mt-4 flex items-start gap-2.5 rounded-sm border border-signal-red/25 bg-signal-red/[0.06] px-3 py-3 text-[11px] leading-relaxed text-signal-red">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-acid">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Moderation mode active
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {records.length} {records.length === 1 ? "record" : "records"}{" "}
                    · newest first
                  </p>
                </div>
                <button
                  type="button"
                  onClick={lock}
                  className="inline-flex h-8 items-center gap-2 rounded-sm border border-white/15 px-3 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
                >
                  <LockKeyhole className="h-3 w-3" />
                  Lock
                </button>
              </div>

              {error ? (
                <div className="mt-4 flex items-start gap-2.5 rounded-sm border border-signal-red/25 bg-signal-red/[0.06] px-3 py-3 text-[11px] leading-relaxed text-signal-red">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {notice ? (
                <div className="mt-4 flex items-start gap-2.5 rounded-sm border border-acid/25 bg-acid/[0.055] px-3 py-3 text-[11px] leading-relaxed text-acid">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{notice}</span>
                </div>
              ) : null}

              {records.length === 0 ? (
                <div className="mt-6 rounded-sm border border-white/[0.08] bg-white/[0.02] px-5 py-10 text-center">
                  <p className="font-display text-[15px] font-semibold text-zinc-300">
                    No records in the archive
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    Submitted reports will appear here for moderation.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-2">
                  {records.map((record) => {
                    const playerName = playerNameWithoutAlliance(
                      record.offendingPlayer,
                      record.offendingAlliance,
                    );
                    const isDeleting = deletingId === record.id;
                    const isConfirming = pendingDelete === record.id;

                    return (
                      <li
                        key={record.id}
                        className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-3.5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-sm border border-white/10 bg-white/[0.035] px-1.5 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-300">
                                {reportTypeLabel(record.reportType)}
                              </span>
                              <span
                                className={
                                  record.isViolation
                                    ? "font-mono text-[8px] uppercase tracking-[0.12em] text-acid"
                                    : "font-mono text-[8px] uppercase tracking-[0.12em] text-signal-cyan"
                                }
                              >
                                {record.isViolation
                                  ? "Scored violation"
                                  : "External / audit only"}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                              <span className="font-mono text-[13px] font-semibold text-white">
                                {allianceBadge(record.offendingAlliance)}
                              </span>
                              <span
                                className="truncate text-[12px] text-zinc-300"
                                title={playerName}
                              >
                                {playerName}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] uppercase tracking-[0.08em] text-zinc-600">
                              <span>Server #{record.offendingServer}</span>
                              <span>
                                {formatBattleTimestamp(record.battleTimestamp)} UTC
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isConfirming ? (
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-signal-red">
                                  Delete permanently?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(record.id)}
                                  disabled={isDeleting}
                                  className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-signal-red/40 bg-signal-red/10 px-2.5 font-mono text-[9px] uppercase tracking-[0.08em] text-signal-red transition-colors hover:bg-signal-red/20 disabled:opacity-50"
                                >
                                  {isDeleting ? (
                                    <LoaderCircle className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                  {isDeleting ? "Deleting" : "Confirm"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDelete(null)}
                                  disabled={isDeleting}
                                  className="h-8 rounded-sm border border-white/10 px-2.5 font-mono text-[9px] uppercase tracking-[0.08em] text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDelete(record.id)}
                                disabled={deletingId !== null}
                                className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-white/10 px-2.5 font-mono text-[9px] uppercase tracking-[0.08em] text-zinc-400 transition-colors hover:border-signal-red/40 hover:text-signal-red disabled:opacity-40"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
