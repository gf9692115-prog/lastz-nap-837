import { describe, expect, it } from "vitest";

import {
  evaluateBountyExtraction,
  evaluateExtraction,
  normalizeBattleTimestamp,
  parsePlayerIdentity,
  UNSUPPORTED_REPORT_MESSAGE,
} from "../supabase/functions/_shared/rules.ts";

const FIXED_NOW = new Date("2026-11-20T15:00:00Z");

function player(
  rawDisplayName: string,
  playerName: string,
  alliance: string,
  server: string,
  hasServerTag: boolean,
) {
  return { rawDisplayName, playerName, alliance, server, hasServerTag };
}

const EMPTY_PLAYER = player("", "", "", "", false);

function extraction(overrides: Record<string, unknown>) {
  return {
    reportType: "TRUCK_PLUNDER",
    isSupportedReport: true,
    confidence: 0.95,
    battleTimeRaw: "2026-11-10 15:52:34",
    battleTimeIso: "2026-11-10T15:52:00Z",
    bountyOffender: EMPTY_PLAYER,
    leftPlayer: player("[.0Lz]Potit Rove", "Potit Rove", ".0Lz", "837", false),
    rightPlayer: EMPTY_PLAYER,
    notes: "",
    ...overrides,
  };
}

describe("Server 837 NAP rule engine", () => {
  it("scores a local bounty plunderer from the bounty card", () => {
    const result = evaluateExtraction(
      extraction({
        reportType: "BOUNTY_PLUNDER",
        bountyOffender: player(
          "#837 [RAON]TrippleHopped",
          "TrippleHopped",
          "RAON",
          "837",
          true,
        ),
        leftPlayer: EMPTY_PLAYER,
        rightPlayer: EMPTY_PLAYER,
        battleTimeRaw: "11-20 13:22",
        battleTimeIso: "2026-11-20T13:22:00Z",
      }),
      { now: FIXED_NOW },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.isViolation).toBe(true);
    expect(result.decision.offendingAlliance).toBe("RAON");
    expect(result.decision.offendingPlayer).toBe("[RAON]TrippleHopped");
    expect(result.decision.offendingServer).toBe("837");
    expect(result.decision.victimPlayer).toBeNull();
    expect(result.decision.battleTimestamp).toBe("2026-11-20T13:22:00.000Z");
  });

  it("evaluates every visible bounty row from one mission-record list", () => {
    const result = evaluateBountyExtraction(
      extraction({
        reportType: "BOUNTY_PLUNDER",
        bountyOffender: EMPTY_PLAYER,
        leftPlayer: EMPTY_PLAYER,
        rightPlayer: EMPTY_PLAYER,
        bountyRecords: [
          {
            offender: player(
              "#837 [W01]jfdhjxbvdvh",
              "jfdhjxbvdvh",
              "W01",
              "837",
              true,
            ),
            battleTimeRaw: "11-23 18:06",
            battleTimeIso: "2026-11-23T18:06:00Z",
          },
          {
            offender: player(
              "#837 [CUBS]Tokatlı",
              "Tokatlı",
              "CUBS",
              "837",
              true,
            ),
            battleTimeRaw: "11-23 17:58",
            battleTimeIso: "2026-11-23T17:58:00Z",
          },
          {
            offender: player(
              "#839 [NFNC]MUNCANG 3",
              "MUNCANG 3",
              "NFNC",
              "839",
              true,
            ),
            battleTimeRaw: "11-23 17:47",
            battleTimeIso: "2026-11-23T17:47:00Z",
          },
        ],
      }),
      { now: FIXED_NOW },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decisions).toHaveLength(3);
    expect(result.decisions[0].offendingPlayer).toBe("[W01]jfdhjxbvdvh");
    expect(result.decisions[0].isViolation).toBe(true);
    expect(result.decisions[1].offendingAlliance).toBe("CUBS");
    expect(result.decisions[1].battleTimestamp).toBe("2026-11-23T17:58:00.000Z");
    expect(result.decisions[2].offendingServer).toBe("839");
    expect(result.decisions[2].isViolation).toBe(false);
  });

  it("exempts an external-server bounty plunderer", () => {
    const result = evaluateExtraction(
      extraction({
        reportType: "BOUNTY_PLUNDER",
        bountyOffender: player(
          "#838 [RAON]TrippleHopped",
          "TrippleHopped",
          "RAON",
          "838",
          true,
        ),
        leftPlayer: EMPTY_PLAYER,
        rightPlayer: EMPTY_PLAYER,
        battleTimeRaw: "11-20 13:22",
      }),
      { now: FIXED_NOW },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.isViolation).toBe(false);
    expect(result.decision.offendingServer).toBe("838");
    expect(result.decision.reason).toContain("not counted");
  });

  it("uses the RIGHT player in a resource tile report and never the left victim", () => {
    const result = evaluateExtraction(
      extraction({
        reportType: "RESOURCE_TILE",
        battleTimeRaw: "2026-11-14 14:34:12",
        rightPlayer: player("[Gty]iCU4U", "iCU4U", "Gty", "837", false),
      }),
      { now: FIXED_NOW },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.offendingAlliance).toBe("Gty");
    expect(result.decision.offendingPlayer).toBe("[Gty]iCU4U");
    expect(result.decision.victimPlayer).toBe("[.0Lz]Potit Rove");
    expect(result.decision.isViolation).toBe(true);
    expect(result.decision.battleTimestamp).toBe("2026-11-14T14:34:00.000Z");
  });

  it("rejects a VS report when only the left player was extracted", () => {
    const result = evaluateExtraction(
      extraction({
        reportType: "RESOURCE_TILE",
        rightPlayer: EMPTY_PLAYER,
      }),
      { now: FIXED_NOW },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_REPORT");
  });

  it("exempts an external #838 truck attacker", () => {
    const result = evaluateExtraction(
      extraction({
        rightPlayer: player(
          "#838 [VNNa]メηα²β",
          "メηα²β",
          "VNNa",
          "838",
          true,
        ),
      }),
      { now: FIXED_NOW },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.isViolation).toBe(false);
    expect(result.decision.offendingServer).toBe("838");
    expect(result.decision.offendingAlliance).toBe("VNNa");
    expect(result.decision.offendingPlayer).toBe("[VNNa]メηα²β");
  });

  it("scores a local truck attacker with no server prefix and preserves 0 in d00m", () => {
    const result = evaluateExtraction(
      extraction({
        rightPlayer: player("[d00m]RAKK", "RAKK", "d00m", "837", false),
      }),
      { now: FIXED_NOW },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.decision.isViolation).toBe(true);
    expect(result.decision.offendingAlliance).toBe("d00m");
    expect(result.decision.offendingPlayer).toBe("[d00m]RAKK");
    expect(result.decision.reason).toContain("trade-truck");
  });

  it("does not trust a model-supplied foreign server if the label has no tag", () => {
    const result = parsePlayerIdentity(
      player("[d00m]RAKK", "RAKK", "d00m", "838", false),
    );

    expect(result?.server).toBe("837");
    expect(result?.hasServerTag).toBe(false);
  });

  it("keeps an explicit #837 prefix but removes it from the stored full label", () => {
    const result = parsePlayerIdentity(
      player("#837 [RAON]TrippleHopped", "TrippleHopped", "RAON", "837", true),
    );

    expect(result?.server).toBe("837");
    expect(result?.displayName).toBe("[RAON]TrippleHopped");
    expect(result?.alliance).toBe("RAON");
  });

  it("reads a server prefix even when the nickname follows without a space", () => {
    const result = parsePlayerIdentity(
      player("#838メηα²β", "メηα²β", "", "838", true),
    );

    expect(result?.server).toBe("838");
    expect(result?.displayName).toBe("メηα²β");
  });

  it("preserves non-ASCII digits inside the displayed player name", () => {
    const result = parsePlayerIdentity(
      player("#837 [RAON]Tripple٧Hopped", "Tripple٧Hopped", "RAON", "837", true),
    );

    expect(result?.displayName).toBe("[RAON]Tripple٧Hopped");
  });

  it("normalizes a full timestamp and truncates seconds", () => {
    expect(
      normalizeBattleTimestamp("2026-11-10 12:26:53", "", FIXED_NOW),
    ).toBe("2026-11-10T12:26:00.000Z");
  });

  it("fills missing year with the current UTC year", () => {
    expect(normalizeBattleTimestamp("11-20 13:22", "", FIXED_NOW)).toBe(
      "2026-11-20T13:22:00.000Z",
    );
  });

  it("accepts Arabic-Indic digits in a timestamp", () => {
    expect(
      normalizeBattleTimestamp(
        "٢٠٢٦-١١-١٤ ١٤:٣٤:١٢",
        "",
        FIXED_NOW,
      ),
    ).toBe("2026-11-14T14:34:00.000Z");
  });

  it("rejects unsupported screens with the required user message", () => {
    const result = evaluateExtraction(
      extraction({
        reportType: "UNKNOWN",
        isSupportedReport: false,
        confidence: 0.1,
      }),
      { now: FIXED_NOW },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("UNSUPPORTED_REPORT");
    expect(result.message).toBe(UNSUPPORTED_REPORT_MESSAGE);
    expect(result.message).toBe(UNSUPPORTED_REPORT_MESSAGE);
  });

  it("rejects low-confidence extractions instead of scoring them", () => {
    const result = evaluateExtraction(
      extraction({
        confidence: 0.2,
        rightPlayer: player("[d00m]RAKK", "RAKK", "d00m", "837", false),
      }),
      { now: FIXED_NOW },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_REPORT");
  });

  it("rejects an unreadable timestamp", () => {
    const result = evaluateExtraction(
      extraction({
        battleTimeRaw: "战斗报告",
        battleTimeIso: "",
        rightPlayer: player("[d00m]RAKK", "RAKK", "d00m", "837", false),
      }),
      { now: FIXED_NOW },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_REPORT");
  });
});
