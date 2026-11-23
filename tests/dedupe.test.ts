import { describe, expect, it } from "vitest";

import {
  isLikelySamePlayer,
  normalizeComparablePlayer,
} from "../supabase/functions/_shared/dedupe.ts";

describe("OCR-safe bounty player dedupe", () => {
  it("recognizes the observed W01 OCR variants as the same player", () => {
    expect(
      isLikelySamePlayer("[W01]jfdhjxbdvdh", "[W01]jfdhjxbvdvh"),
    ).toBe(true);
  });

  it("does not merge distinct player names in the same alliance", () => {
    expect(isLikelySamePlayer("[W01]ShadowWolf", "[W01]IronTiger")).toBe(false);
  });

  it("keeps short names exact-only", () => {
    expect(isLikelySamePlayer("[W01]Ali", "[W01]Alp")).toBe(false);
    expect(normalizeComparablePlayer("[W01]Okay Pro")).toBe("okaypro");
  });
});
