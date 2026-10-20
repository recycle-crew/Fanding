import { afterEach, beforeEach, vi } from "vitest";

// Freeze before imports: Redux seed state is created during module evaluation.
function resetClock() {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-20T08:00:00Z"));
}
resetClock();
beforeEach(resetClock);
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
