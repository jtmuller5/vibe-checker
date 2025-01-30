import { describe, it } from "vitest";
import { evaluateResponse } from "./vibe_checker";

describe("Cash Register", () => {
  it("should provide cash", async () => {
    await evaluateResponse({
      input: "Can I have some cash?",
      actualOutput: "No",
      expectedOutput: "Yes, how much would you like?",
    });
  });
});
