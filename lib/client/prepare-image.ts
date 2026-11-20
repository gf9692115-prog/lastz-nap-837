import {
  CLIENT_INPUT_IMAGE_MIME_TYPES,
  MAX_CLIENT_RAW_BYTES,
} from "../constants";

const COMPRESSION_THRESHOLD_BYTES = 3.5 * 1024 * 1024;
const MAX_EDGE = 2200;
const TARGET_BYTES = 3.2 * 1024 * 1024;
const OUTPUT_QUALITY = 0.9;

const EXTENSION_MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

function fileExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

function resolveFileMime(file: File): string | null {
  const mime = file.type.toLowerCase();
  if ((CLIENT_INPUT_IMAGE_MIME_TYPES as readonly string[]).includes(mime)) {
    return mime;
  }
  const byExtension = EXTENSION_MIME_MAP[fileExtension(file)];
  return byExtension ?? null;
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Safari/older browsers can fail here; fall through to <img>.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await image.decode();

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch {
    URL.revokeObjectURL(objectUrl);
    throw new Error(
      "无法读取这张图片；HEIC 请先在系统相册中转存为 JPG 后再上传",
    );
  }
}

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("图片压缩失败，请尝试另一张截图"));
      },
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Prepare a screenshot for upload. Only large files are re-encoded, preserving
 * small screenshot text where possible. The server independently verifies the
 * magic bytes and size.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!file || file.size === 0) {
    throw new Error("请选择一张有效的战报截图");
  }

  if (file.size > MAX_CLIENT_RAW_BYTES) {
    throw new Error("原图超过 15MB，请先裁剪或压缩后再上传");
  }

  const mime = resolveFileMime(file);
  if (!mime) {
    throw new Error("仅支持 JPG、PNG、WebP 格式的战报截图");
  }

  // DeepSeek vision does not accept HEIC/HEIF, so phone photos of these types
  // must always be transcoded, even when they are small.
  const needsConversion = mime === "image/heic" || mime === "image/heif";

  if (!needsConversion && file.size <= COMPRESSION_THRESHOLD_BYTES) {
    return file;
  }

  const decoded = await decodeImage(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(decoded.width, decoded.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(decoded.width * scale));
    canvas.height = Math.max(1, Math.round(decoded.height * scale));

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("当前浏览器无法压缩图片，请换一个浏览器重试");
    }

    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);

    let blob = await canvasToJpeg(canvas, OUTPUT_QUALITY);

    if (blob.size > TARGET_BYTES) {
      blob = await canvasToJpeg(canvas, 0.78);
    }

    if (blob.size > TARGET_BYTES * 1.35) {
      const smallerScale = Math.min(
        scale,
        1800 / Math.max(decoded.width, decoded.height),
      );
      canvas.width = Math.max(1, Math.round(decoded.width * smallerScale));
      canvas.height = Math.max(1, Math.round(decoded.height * smallerScale));
      const smallerContext = canvas.getContext("2d", { alpha: false });
      if (smallerContext) {
        smallerContext.fillStyle = "#000000";
        smallerContext.fillRect(0, 0, canvas.width, canvas.height);
        smallerContext.imageSmoothingEnabled = true;
        smallerContext.imageSmoothingQuality = "high";
        smallerContext.drawImage(
          decoded.source,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        blob = await canvasToJpeg(canvas, 0.8);
      }
    }

    if (blob.size > 4 * 1024 * 1024) {
      throw new Error("截图压缩后仍然过大，请裁剪战报区域后再上传");
    }

    // If compression made the file larger, retain the original when safe.
    // HEIC/HEIF must never be returned in their original format.
    if (
      !needsConversion &&
      blob.size >= file.size &&
      file.size <= 4 * 1024 * 1024
    ) {
      return file;
    }

    const baseName = file.name.replace(/\.[^.]+$/u, "").slice(0, 60) || "report";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    decoded.cleanup();
  }
}
