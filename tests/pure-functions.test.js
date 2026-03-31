import { describe, it, expect } from "vitest";
import { loadCveInterfaceFunctions } from "./helpers.js";

const { get_deep, set_deep, simpleCopy, checkurl, check_json, queryParser } =
  loadCveInterfaceFunctions();

describe("get_deep", () => {
  it("returns nested property value", () => {
    const obj = { a: { b: { c: "good" } } };
    expect(get_deep(obj, "a.b.c")).toBe("good");
  });

  it("returns undefined for missing nested property", () => {
    expect(get_deep({ a: { b: 1 } }, "a.c")).toBeUndefined();
  });

  it("returns undefined for non-object input", () => {
    expect(get_deep("string", "a")).toBeUndefined();
  });

  it("handles array indices", () => {
    const obj = { a: [{ name: "first" }, { name: "second" }] };
    expect(get_deep(obj, "a.1.name")).toBe("second");
  });

  it("returns top-level property", () => {
    expect(get_deep({ foo: "bar" }, "foo")).toBe("bar");
  });
});

describe("set_deep", () => {
  it("sets nested property value", () => {
    const obj = { a: { b: { c: "old" } } };
    const result = set_deep(obj, "a.b.c", "new");
    expect(result.a.b.c).toBe("new");
  });

  it("does not mutate original object", () => {
    const obj = { a: { b: 1 } };
    set_deep(obj, "a.b", 2);
    expect(obj.a.b).toBe(1);
  });

  it("creates intermediate objects", () => {
    const obj = {};
    const result = set_deep(obj, "a.b.c", "value");
    expect(result.a.b.c).toBe("value");
  });

  it("creates intermediate arrays when next key is numeric", () => {
    const obj = {};
    const result = set_deep(obj, "a.0", "value");
    expect(Array.isArray(result.a)).toBe(true);
    expect(result.a[0]).toBe("value");
  });

  it("deletes property when value is undefined", () => {
    const obj = { a: { b: "remove_me" } };
    const result = set_deep(obj, "a.b", undefined);
    expect("b" in result.a).toBe(false);
  });

  it("splices array element when deleting numeric index", () => {
    const obj = { items: ["a", "b", "c"] };
    const result = set_deep(obj, "items.1", undefined);
    expect(result.items).toEqual(["a", "c"]);
  });

  it("returns undefined for non-object input", () => {
    expect(set_deep("string", "a", 1)).toBeUndefined();
  });
});

describe("simpleCopy", () => {
  it("creates a deep copy", () => {
    const obj = { a: { b: [1, 2, 3] } };
    const copy = simpleCopy(obj);
    copy.a.b.push(4);
    expect(obj.a.b.length).toBe(3);
    expect(copy.a.b.length).toBe(4);
  });
});

describe("checkurl", () => {
  it("accepts valid URLs", () => {
    expect(checkurl("https://example.com")).toBe(true);
    expect(checkurl("http://localhost:8080")).toBe(true);
    expect(checkurl("https://cve.org/api/v1/cve")).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(checkurl("not-a-url")).toBe(false);
    expect(checkurl("")).toBe(false);
    expect(checkurl("://missing-scheme")).toBe(false);
  });
});

describe("check_json", () => {
  it("accepts valid CVE JSON structure", () => {
    const valid = {
      affected: [
        {
          versions: [{ version: "1.0", status: "affected" }],
          product: "Widget",
          vendor: "Acme",
        },
      ],
    };
    expect(check_json(valid)).toBe(true);
  });

  it("rejects missing affected", () => {
    expect(check_json({})).toBe(false);
  });

  it("rejects empty affected array", () => {
    expect(check_json({ affected: [] })).toBe(false);
  });

  it("rejects affected without versions", () => {
    expect(check_json({ affected: [{ product: "x" }] })).toBe(false);
  });

  it("rejects affected with empty versions", () => {
    expect(check_json({ affected: [{ versions: [] }] })).toBe(false);
  });
});

describe("queryParser", () => {
  it("parses simple key=value pairs", () => {
    const result = queryParser("foo=bar&baz=qux");
    expect(result).toEqual({ foo: "bar", baz: "qux" });
  });

  it("decodes URL-encoded values", () => {
    const result = queryParser("name=hello+world&path=%2Ffoo%2Fbar");
    expect(result.name).toBe("hello world");
    expect(result.path).toBe("/foo/bar");
  });

  it("handles colon as delimiter", () => {
    const result = queryParser("key:value");
    expect(result.key).toBe("value");
  });

  it("handles empty values", () => {
    const result = queryParser("key=");
    expect(result.key).toBe("");
  });
});
