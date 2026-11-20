import { describe, expect, it } from "vitest";

import {
  detectSupportedImageMime,
  extensionForMime,
} from "../supabase/functions/_shared/image.ts";

function ascii(value: string): number[] {
  return Array.from(value, (character) => character.charCodeAt(0));
}

describe("Edge image signature checks", () => {
  it("accepts JPEG magic bytes", () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(detectSupportedImageMime(bytes)).toBe("image/jpeg");
  });

  it("accepts PNG magic bytes", () => {
    const bytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    expect(detectSupportedImageMime(bytes)).toBe("image/png");
  });

  it("accepts WebP magic bytes", () => {
    const bytes = new Uint8Array([
      ...ascii("RIFF"),
      0,
      0,
      0,
      0,
      ...ascii("WEBP"),
    ]);
    expect(detectSupportedImageMime(bytes)).toBe("image/webp");
  });

  it("rejects HEIC/HEIF because they must be converted first", () => {
    const bytes = new Uint8Array([
      0,
      0,
      0,
      24,
      ...ascii("ftyp"),
      ...ascii("heic"),
      0,
      0,
      0,
      0,
    ]);
    expect(detectSupportedImageMime(bytes)).toBeNull();
  });

  it("maps MIME types to storage extensions", () => {
    expect(extensionForMime("image/jpeg")).toBe("jpg");
    expect(extensionForMime("image/png")).toBe("png");
    expect(extensionForMime("image/webp")).toBe("webp");
    expect(extensionForMime("image/heic")).toBe("bin");
  });
});
