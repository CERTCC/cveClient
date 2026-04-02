import { describe, it, expect, beforeEach, vi } from "vitest";
import { cveClient as CveClient } from "./helpers.js";

/* Mock fetch so rfetch() doesn't hit the network */
let lastFetchUrl, lastFetchOpts;
global.fetch = vi.fn((url, opts) => {
  lastFetchUrl = url;
  lastFetchOpts = opts;
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  });
});

describe("cveClient — URL construction", () => {
  let client;

  beforeEach(() => {
    client = new CveClient(
      "test-org",
      "test-user",
      "test-api-key-12345",
      "https://cveawg.mitre.org/api",
    );
  });

  it("sets correct user_path on construction", () => {
    expect(client.user_path).toBe("/org/test-org/user/test-user");
  });

  it("constructs correct URL for getcvedetail", async () => {
    await client.getcvedetail("CVE-2024-1234");
    expect(lastFetchUrl).toBe("https://cveawg.mitre.org/api/cve/CVE-2024-1234");
    expect(lastFetchOpts.method).toBe("GET");
  });

  it("constructs correct URL for getcve", async () => {
    await client.getcve("CVE-2024-5678");
    expect(lastFetchUrl).toBe(
      "https://cveawg.mitre.org/api/cve-id/CVE-2024-5678",
    );
  });

  it("injects auth headers on every request", async () => {
    await client.getcvedetail("CVE-2024-1234");
    expect(lastFetchOpts.headers["CVE-API-KEY"]).toBe("test-api-key-12345");
    expect(lastFetchOpts.headers["CVE-API-ORG"]).toBe("test-org");
    expect(lastFetchOpts.headers["CVE-API-USER"]).toBe("test-user");
  });

  it("sets error on invalid base URL", async () => {
    const bad = new CveClient("org", "user", "key", "not-a-url");
    try {
      await bad.getcvedetail("CVE-2024-1");
    } catch (e) {
      // expected
    }
    expect(bad.error).toBeDefined();
  });
});

describe("cveClient — CVE operations", () => {
  let client;

  beforeEach(() => {
    client = new CveClient(
      "test-org",
      "test-user",
      "key",
      "https://api.example.com",
    );
  });

  it("publishcve uses POST for new CVE", async () => {
    await client.publishcve("CVE-2024-1234", { description: "test" });
    expect(lastFetchUrl).toBe("https://api.example.com/cve/CVE-2024-1234/cna");
    expect(lastFetchOpts.method).toBe("POST");
    expect(JSON.parse(lastFetchOpts.body)).toEqual({
      cnaContainer: { description: "test" },
    });
  });

  it("publishcve uses PUT for update", async () => {
    await client.publishcve("CVE-2024-1234", { description: "test" }, true);
    expect(lastFetchOpts.method).toBe("PUT");
  });

  it("publishcve uses reject path when rejected flag set", async () => {
    await client.publishcve(
      "CVE-2024-1234",
      { description: "test" },
      false,
      true,
    );
    expect(lastFetchUrl).toBe(
      "https://api.example.com/cve/CVE-2024-1234/reject",
    );
  });

  it("reservecve defaults to amount 1 and current year", async () => {
    await client.reservecve();
    const url = new URL(lastFetchUrl);
    expect(url.searchParams.get("amount")).toBe("1");
    expect(url.searchParams.get("short_name")).toBe("test-org");
    expect(url.searchParams.get("cve_year")).toBe(
      String(new Date().getFullYear()),
    );
    expect(lastFetchOpts.method).toBe("POST");
  });

  it("reservecve batch defaults to sequential", async () => {
    await client.reservecve(5, 2024);
    const url = new URL(lastFetchUrl);
    expect(url.searchParams.get("batch_type")).toBe("sequential");
    expect(url.searchParams.get("amount")).toBe("5");
  });

  it("reservecve accepts nonsequential batch type", async () => {
    await client.reservecve(3, 2024, "nonsequential");
    const url = new URL(lastFetchUrl);
    expect(url.searchParams.get("batch_type")).toBe("nonsequential");
  });
});

describe("cveClient — ADP operations", () => {
  let client;

  beforeEach(() => {
    client = new CveClient(
      "test-org",
      "test-user",
      "key",
      "https://api.example.com",
    );
  });

  it("publishadp uses PUT to /cve/{id}/adp", async () => {
    const adpData = { adpContainer: { metrics: [] } };
    await client.publishadp("CVE-2024-1234", adpData);
    expect(lastFetchUrl).toBe("https://api.example.com/cve/CVE-2024-1234/adp");
    expect(lastFetchOpts.method).toBe("PUT");
  });

  it("getadp uses GET to /cve/{id}/adp", async () => {
    await client.getadp("CVE-2024-1234");
    expect(lastFetchUrl).toBe("https://api.example.com/cve/CVE-2024-1234/adp");
    expect(lastFetchOpts.method).toBe("GET");
  });

  it("deleteadp uses DELETE to /cve/{id}/adp", async () => {
    await client.deleteadp("CVE-2024-1234");
    expect(lastFetchUrl).toBe("https://api.example.com/cve/CVE-2024-1234/adp");
    expect(lastFetchOpts.method).toBe("DELETE");
  });
});
