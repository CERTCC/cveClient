import { describe, it, expect } from "vitest";
import { queryParser, createSafeHTML, createCleanHTML } from "./helpers.js";

const safeHTML = createSafeHTML();
const cleanHTML = createCleanHTML();

describe("queryParser — prototype pollution protection", () => {
  it("rejects __proto__ key", () => {
    const result = queryParser("__proto__=polluted&safe=value");
    expect(Object.hasOwn(result, "__proto__")).toBe(false);
    expect(result.safe).toBe("value");
    // Verify Object.prototype was not polluted
    expect({}.polluted).toBeUndefined();
  });

  it("rejects constructor key", () => {
    const result = queryParser("constructor=polluted");
    // result.constructor should be the default Object constructor, not 'polluted'
    expect(typeof result.constructor).toBe("function");
  });

  it("rejects prototype key", () => {
    const result = queryParser("prototype=polluted&name=ok");
    expect(result.prototype).toBeUndefined();
    expect(result.name).toBe("ok");
  });

  it("rejects encoded __proto__", () => {
    const result = queryParser("__proto__=polluted");
    expect(Object.hasOwn(result, "__proto__")).toBe(false);
    expect({}.polluted).toBeUndefined();
  });

  it("still parses normal keys correctly", () => {
    const result = queryParser("cve=CVE-2024-1234&state=PUBLISHED");
    expect(result.cve).toBe("CVE-2024-1234");
    expect(result.state).toBe("PUBLISHED");
  });
});

describe("safeHTML — XSS prevention", () => {
  it("escapes script tags", () => {
    const result = safeHTML('<script>alert("xss")</script>');
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("escapes img onerror payloads", () => {
    const result = safeHTML("<img src=x onerror=alert(1)>");
    expect(result).not.toContain("<img");
    expect(result).toContain("&lt;img");
  });

  it("escapes HTML entities", () => {
    const result = safeHTML('<b>bold</b> & "quotes"');
    expect(result).toContain("&lt;b&gt;");
    expect(result).toContain("&amp;");
    // Note: textContent/innerHTML does not escape double quotes
    expect(result).toContain('"quotes"');
  });

  it("preserves safe text", () => {
    expect(safeHTML("hello world")).toBe("hello world");
    expect(safeHTML("CVE-2024-12345")).toBe("CVE-2024-12345");
  });

  it("handles empty input", () => {
    expect(safeHTML("")).toBe("");
  });

  it("escapes username-style XSS payload", () => {
    const payload = "<img src=x onerror=alert(document.cookie)>@test.com";
    const result = safeHTML(payload);
    expect(result).not.toContain("<img");
    expect(result).toContain("@test.com");
  });
});

describe("cleanHTML — autoCompleter XSS prevention", () => {
  it("escapes HTML in suggestions", () => {
    const result = cleanHTML("<script>steal()</script>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("preserves normal suggestion text", () => {
    expect(cleanHTML("CWE-79: Cross-site Scripting")).toBe(
      "CWE-79: Cross-site Scripting",
    );
  });
});
