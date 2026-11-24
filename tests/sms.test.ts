import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The real module is a Next.js build-time guard; it has no runtime behaviour.
vi.mock("server-only", () => ({}));

import { isValidPakistaniPhone, normalisePhone, sendSms } from "@/lib/services/sms";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("normalisePhone", () => {
  it.each([
    ["03001234567", "+923001234567"],
    ["3001234567", "+923001234567"],
    ["+923001234567", "+923001234567"],
    ["+92 300 1234567", "+923001234567"],
    ["+92 (300) 123-4567", "+923001234567"],
  ])("normalises %s to %s", (input, expected) => {
    expect(normalisePhone(input)).toBe(expected);
  });

  it("leaves unrecognised numbers trimmed but otherwise unchanged", () => {
    expect(normalisePhone("  +1 415 555 0132  ")).toBe("+1 415 555 0132");
    expect(normalisePhone("12345")).toBe("12345");
  });
});

describe("isValidPakistaniPhone", () => {
  it("accepts local, national and international Pakistani mobile formats", () => {
    expect(isValidPakistaniPhone("03001234567")).toBe(true);
    expect(isValidPakistaniPhone("3001234567")).toBe(true);
    expect(isValidPakistaniPhone("+923001234567")).toBe(true);
    expect(isValidPakistaniPhone("+92 300 1234567")).toBe(true);
  });

  it("rejects short, alphanumeric and foreign numbers", () => {
    expect(isValidPakistaniPhone("0300123456")).toBe(false);
    expect(isValidPakistaniPhone("+92300123456")).toBe(false);
    expect(isValidPakistaniPhone("0300123456x")).toBe(false);
    expect(isValidPakistaniPhone("+14155550132")).toBe(false);
    expect(isValidPakistaniPhone("00923001234567")).toBe(false);
    expect(isValidPakistaniPhone("")).toBe(false);
  });
});

describe("sendSms", () => {
  beforeEach(() => {
    vi.stubEnv("SMS_PROVIDER", "console");
  });

  it("logs and previews the message with the console provider", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    const result = await sendSms("+923001234567", "Your Garidekho code is 123456.");

    expect(result).toEqual({
      sent: true,
      provider: "console",
      preview: "Your Garidekho code is 123456.",
    });
    expect(info).toHaveBeenCalledWith("[SMS:+923001234567] Your Garidekho code is 123456.");
  });

  it("posts JSON with a bearer token to a configured webhook", async () => {
    vi.stubEnv("SMS_PROVIDER", "webhook");
    vi.stubEnv("SMS_API_URL", "https://sms.example.test/send");
    vi.stubEnv("SMS_API_KEY", "key-123");
    vi.stubEnv("SMS_SENDER_ID", "GARIDEKHO");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendSms("+923001234567", "Hello");

    expect(result).toEqual({ sent: true, provider: "webhook" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://sms.example.test/send");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Bearer key-123",
      }),
    );
    expect(JSON.parse(String(init.body))).toEqual({
      to: "+923001234567",
      message: "Hello",
      sender: "GARIDEKHO",
    });
  });

  it("fails fast when a webhook URL is missing or the provider rejects the request", async () => {
    vi.stubEnv("SMS_PROVIDER", "webhook");
    vi.stubEnv("SMS_API_URL", "");

    await expect(sendSms("+923001234567", "Hello")).rejects.toThrow(
      "SMS_API_URL is required for the webhook provider",
    );

    vi.stubEnv("SMS_API_URL", "https://sms.example.test/send");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429 }),
    );

    await expect(sendSms("+923001234567", "Hello")).rejects.toThrow(
      "SMS provider rejected request: 429",
    );
  });

  it("rejects an unconfigured provider rather than silently dropping the OTP", async () => {
    vi.stubEnv("SMS_PROVIDER", "carrier-pigeon");

    await expect(sendSms("+923001234567", "Hello")).rejects.toThrow(
      "Unsupported SMS provider: carrier-pigeon",
    );
  });
});
