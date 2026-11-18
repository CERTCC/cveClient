// @vitest-environment node
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { expect, it, vi } from "vitest";

it("warns when asynchronous key persistence fails", async () => {
  const alert = vi.fn();
  const jquery = vi.fn();
  jquery.getScript = () => ({
    done(callback) {
      callback();
      return { fail() {} };
    },
  });
  const context = createContext({
    $: jquery,
    URL,
    console: { log: vi.fn() },
    check_create_key: () => Promise.reject(new Error("storage failed")),
    arrayBuffertoURI: vi.fn(),
    alert,
  });
  runInContext(readFileSync(new URL("../cveInterface.js", import.meta.url), "utf8"), context);
  runInContext(`
    client = { user: "test-user", key: "test-key" };
    top_alert = alert;
    enable_encryption();
  `, context);

  await vi.waitFor(() => {
    expect(alert).toHaveBeenCalledWith(
      "warning",
      "Encrypting API key failed, see console log for errors",
    );
  });
});
