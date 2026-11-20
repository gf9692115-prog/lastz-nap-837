"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Crosshair,
  ImageUp,
  LoaderCircle,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

import { prepareImageForUpload } from "@/lib/client/prepare-image";
import type { UploadApiResponse } from "@/lib/types";

import { ResultCard } from "./result-card";

type UploadStage = "idle" | "compressing" | "uploading" | "analyzing";

const STAGE_COPY: Record<
  Exclude<UploadStage, "idle">,
  { title: string; detail: string }
> = {
  compressing: {
    title: "正在优化截图",
    detail: "保留文字清晰度，压缩大图体积…",
  },
  uploading: {
    title: "正在上传证据",
    detail: "截图加密传输至云端存档…",
  },
  analyzing: {
    title: "DeepSeek 正在阅卷",
    detail: "识别战报类型、攻守方、联盟与时间…",
  },
};

function localError(message: string): UploadApiResponse {
  return {
    ok: false,
    code: "INVALID_IMAGE",
    message,
  };
}

export function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const unmountedRef = useRef(false);
  const dragDepthRef = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);

  const [stage, setStage] = useState<UploadStage>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<UploadApiResponse | null>(null);

  const busy = stage !== "idle";
  const stageCopy = stage === "idle" ? null : STAGE_COPY[stage];

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const replacePreview = useCallback((file: File) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreviewUrl(url);
  }, []);

  const clearPreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  useEffect(() => {
    // StrictMode runs an extra setup/cleanup cycle in development. Reset this
    // guard on every setup so the remounted component can still finish uploads.
    unmountedRef.current = false;

    return () => {
      unmountedRef.current = true;
      abortRef.current?.abort();
      clearTimers();
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, [clearTimers]);

  useEffect(() => {
    if (!result) return;
    const frame = window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({
        behavior:
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        block: "nearest",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [result]);

  const processFile = useCallback(
    async (file: File) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setResult(null);
      setStage("compressing");

      const controller = new AbortController();
      abortRef.current = controller;
      let timedOut = false;

      try {
        const prepared = await prepareImageForUpload(file);
        if (controller.signal.aborted) return;

        replacePreview(prepared);
        setStage("uploading");

        timerRef.current = setTimeout(() => {
          if (!controller.signal.aborted) setStage("analyzing");
        }, 850);

        timeoutRef.current = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, 70_000);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: (() => {
            const body = new FormData();
            body.append("image", prepared, prepared.name || "report.jpg");
            return body;
          })(),
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        clearTimers();

        let payload: UploadApiResponse | null = null;
        try {
          payload = (await response.json()) as UploadApiResponse;
        } catch {
          // Platform-level errors (for example a 413 page) are not JSON.
        }

        if (!payload || typeof payload.message !== "string") {
          setResult(
            localError(
              response.status === 413
                ? "截图体积超过服务器限制，请裁剪战报区域后重试"
                : `上传失败（HTTP ${response.status}），请稍后重试`,
            ),
          );
          return;
        }

        setResult(payload);
        if (payload.ok) {
          router.refresh();
        }
      } catch (error) {
        clearTimers();
        if (unmountedRef.current) return;

        if (timedOut) {
          setResult(localError("识别超时，请稍后重试或换一张更小的截图"));
        } else if (error instanceof DOMException && error.name === "AbortError") {
          setResult(localError("上传已取消，请重新选择截图"));
        } else {
          setResult(
            localError(
              error instanceof Error
                ? error.message
                : "上传失败，请检查网络后重试",
            ),
          );
        }
      } finally {
        if (!unmountedRef.current) {
          setStage("idle");
          clearPreview();
        }
        busyRef.current = false;
        abortRef.current = null;
        clearTimers();
      }
    },
    [clearPreview, clearTimers, replacePreview, router],
  );

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void processFile(file);
  }

  function handleDragEnter(event: DragEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    if (!busyRef.current) setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event: DragEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);

    if (busyRef.current) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
        className="sr-only"
        onChange={handleInputChange}
        tabIndex={-1}
      />

      <button
        type="button"
        onClick={() => {
          if (!busyRef.current) inputRef.current?.click();
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={busy}
        aria-busy={busy}
        aria-label={
          busy
            ? STAGE_COPY[stage as Exclude<UploadStage, "idle">].title
            : "点击选择或拖入战报截图"
        }
        className={`group relative flex min-h-[318px] w-full flex-col items-center justify-center overflow-hidden rounded-sm border border-dashed px-5 py-9 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/80 focus-visible:ring-offset-4 focus-visible:ring-offset-void-900 sm:min-h-[344px] ${
          isDragging
            ? "border-acid bg-acid/[0.09]"
            : busy
              ? "cursor-wait border-acid/45 bg-acid/[0.035]"
              : "cursor-pointer border-white/15 bg-white/[0.025] hover:border-acid/55 hover:bg-acid/[0.035]"
        }`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-fine-grid opacity-40 [background-size:24px_24px] [mask-image:radial-gradient(circle_at_center,black,transparent_76%)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l border-t border-acid/40"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r border-t border-acid/40"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b border-l border-acid/40"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b border-r border-acid/40"
        />

        {previewUrl ? (
          <>
            {/* The local blob preview never leaves the browser. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="absolute inset-0 h-full w-full scale-105 object-cover opacity-25 blur-[2px]"
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-void-950/30 via-void-950/60 to-void-950"
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-20 animate-scan bg-gradient-to-b from-transparent via-acid/[0.16] to-transparent"
            />
          </>
        ) : null}

        <span className="relative z-10 flex flex-col items-center">
          <span
            className={`relative flex h-16 w-16 items-center justify-center rounded-full border transition-colors ${
              busy || isDragging
                ? "border-acid/60 bg-acid/10 text-acid"
                : "border-white/[0.12] bg-white/[0.035] text-zinc-300 group-hover:border-acid/50 group-hover:text-acid"
            }`}
          >
            {busy ? (
              <>
                <LoaderCircle className="h-6 w-6 animate-spin text-acid" />
                <span className="absolute inset-1 rounded-full border border-dashed border-acid/30" />
              </>
            ) : isDragging ? (
              <Crosshair className="h-6 w-6" />
            ) : (
              <ImageUp className="h-6 w-6" />
            )}
          </span>

          <span className="mt-6 font-display text-[21px] font-bold leading-tight tracking-[-0.01em] text-white sm:text-[23px]">
            {busy && stageCopy
              ? stageCopy.title
              : isDragging
                ? "松手，开始判定"
                : "上传战报截图"}
          </span>
          <span className="mt-2 max-w-[320px] text-[12px] leading-relaxed text-zinc-400 sm:text-[13px]">
            {busy && stageCopy
              ? stageCopy.detail
              : isDragging
                ? "支持 JPG / PNG / WebP，HEIC 自动转 JPG"
                : "拖拽到这里，或点击从相册 / 文件选择"}
          </span>

          {!busy && !isDragging ? (
            <span className="mt-5 inline-flex items-center gap-2 rounded-sm bg-acid px-4 py-2.5 font-display text-[12px] font-bold uppercase tracking-[0.08em] text-void-950 transition-colors group-hover:bg-acid-300">
              <ScanLine className="h-4 w-4" />
              选择截图
            </span>
          ) : (
            <span className="mt-5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-acid/80">
              <span className="h-1 w-1 animate-pulse-dot rounded-full bg-acid" />
              {busy ? "AI vision pipeline active" : "Drop zone active"}
            </span>
          )}

          <span className="mt-4 font-mono text-[9px] uppercase tracking-[0.13em] text-zinc-600">
            HEIC 自动转 JPG · 自动压缩大图 · 单张原图 ≤ 15MB
          </span>
        </span>
      </button>

      <div className="mt-3 flex items-start gap-2 px-0.5">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
        <p className="text-[10px] leading-relaxed text-zinc-500">
          请上传包含完整攻守双方与时间的原图。确认为违规后，截图会作为公开证据展示。
        </p>
      </div>

      <div ref={resultRef} className="scroll-mt-24">
        {result ? (
          <ResultCard result={result} onDismiss={() => setResult(null)} />
        ) : null}
      </div>
    </div>
  );
}
