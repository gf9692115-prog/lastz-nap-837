import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  analyzeReportImage,
  DeepSeekAnalysisError,
  DeepSeekConfigurationError,
} from "./deepseek";

const EMPTY_PLAYER = {
  rawDisplayName: "",
  playerName: "",
  alliance: "",
  server: "",
  hasServerTag: false,
};

const extraction = {
  reportType: "TRUCK_PLUNDER",
  isSupportedReport: true,
  confidence: 0.96,
  battleTimeRaw: "2026-11-10 15:52:34",
  battleTimeIso: "2026-11-10T15:52:00Z",
  bountyOffender: EMPTY_PLAYER,
  leftPlayer: {
    rawDisplayName: "[.0Lz]Potit Rove",
    playerName: "Potit Rove",
    alliance: ".0Lz",
    server: "837",
    hasServerTag: false,
  },
  rightPlayer: {
    rawDisplayName: "[d00m]RAKK",
    playerName: "RAKK",
    alliance: "d00m",
    server: "837",
    hasServerTag: false,
  },
  notes: "Trade Truck; right-side attacker.",
};

function completionResponse(content: unknown, status = 200): Response {
  return new Response(
    JSON.stringify({
      choices: [
        {
          finish_reason: status === 200 ? "stop" : "stop",
          message: {
            content: typeof content === "string" ? content : JSON.stringify(content),
          },
        },
      ],
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

describe("DeepSeek vision adapter", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.DEEPSEEK_API_KEY = "test-deepseek-key";
    process.env.DEEPSEEK_BASE_URL = "https://api.deepseek.test";
    process.env.DEEPSEEK_MODEL = "deepseek-flash";
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_BASE_URL;
    delete process.env.DEEPSEEK_MODEL;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends a JSON-mode multimodal request and normalizes the extraction", async () => {
    fetchMock.mockResolvedValueOnce(
      completionResponse({
        ...extraction,
        confidence: "0.96",
        bountyOffender: {},
        rightPlayer: {
          ...extraction.rightPlayer,
          server: "837",
        },
      }),
    );

    const result = await analyzeReportImage({
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]),
      mimeType: "image/jpeg",
    });

    expect(result.reportType).toBe("TRUCK_PLUNDER");
    expect(result.confidence).toBe(0.96);
    expect(result.bountyOffender.rawDisplayName).toBe("");
    expect(result.rightPlayer.alliance).toBe("d00m");
    expect(result.rightPlayer.rawDisplayName).toBe("[d00m]RAKK");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.deepseek.test/chat/completions");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-deepseek-key",
    );

    const body = JSON.parse(String(init.body)) as {
      model: string;
      response_format: { type: string };
      thinking: { type: string };
      messages: Array<{ role: string; content: unknown }>;
    };
    expect(body.model).toBe("deepseek-flash");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.thinking).toEqual({ type: "disabled" });

    const userMessage = body.messages.find((message) => message.role === "user");
    const content = userMessage?.content as Array<Record<string, unknown>>;
    const imagePart = content.find((part) => part.type === "image_url") as {
      image_url: { url: string; detail: string };
    };
    expect(imagePart.image_url.detail).toBe("original");
    expect(imagePart.image_url.url).toMatch(/^data:image\/jpeg;base64,/u);
  });

  it("rejects HEIC before making a provider request", async () => {
    await expect(
      analyzeReportImage({
        buffer: Buffer.from("fake-heic"),
        mimeType: "image/heic",
      }),
    ).rejects.toBeInstanceOf(DeepSeekAnalysisError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires a DeepSeek key", async () => {
    delete process.env.DEEPSEEK_API_KEY;

    await expect(
      analyzeReportImage({
        buffer: Buffer.from("image"),
        mimeType: "image/png",
      }),
    ).rejects.toBeInstanceOf(DeepSeekConfigurationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("turns an invalid JSON-mode response into a provider error", async () => {
    fetchMock.mockResolvedValueOnce(completionResponse("not valid JSON"));

    await expect(
      analyzeReportImage({
        buffer: Buffer.from("image"),
        mimeType: "image/png",
      }),
    ).rejects.toBeInstanceOf(DeepSeekAnalysisError);
  });

  it("maps provider HTTP errors to a provider analysis error", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: "rate limited" } }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      analyzeReportImage({
        buffer: Buffer.from("image"),
        mimeType: "image/webp",
      }),
    ).rejects.toBeInstanceOf(DeepSeekAnalysisError);
  });
});
