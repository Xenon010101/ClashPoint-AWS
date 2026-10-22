import { afterEach, describe, expect, it, vi } from "vitest";
import { liveAccess } from "./config";
afterEach(() => vi.unstubAllEnvs());
describe("live inference access", () => {
  it("is disabled by default and requires a server-defined access code", () => {
    vi.stubEnv("CLASHPOINT_AWS_ENABLED", "false");
    expect(liveAccess(new Request("http://localhost"))).toBe("disabled");
    vi.stubEnv("CLASHPOINT_AWS_ENABLED", "true"); vi.stubEnv("CLASHPOINT_ACCESS_CODE", "test-demo-access-code");
    expect(liveAccess(new Request("http://localhost"))).toBe("unauthorized");
    expect(liveAccess(new Request("http://localhost", { headers: { Authorization: "Bearer test-demo-access-code" } }))).toBe("allowed");
  });
});
