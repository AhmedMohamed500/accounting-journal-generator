// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { loadMissionsProgress, MISSIONS_STORAGE_KEY, recordMissionResult } from "@/lib/storage/missions";

const result = (score:number,attempts=1) => ({ missionId:"mission-001",score,accuracy:Math.round(100/attempts),attempts,hintsUsed:0,elapsedSeconds:40,completedAt:"2026-08-29T10:00:00.000Z",viewedSolution:false });

describe("FINORA Missions isolated progress storage", () => {
  beforeEach(() => localStorage.clear());

  it("saves progress under the training-only key", () => {
    recordMissionResult(result(80,2));
    expect(localStorage.length).toBe(1);
    expect(localStorage.key(0)).toBe(MISSIONS_STORAGE_KEY);
    expect(loadMissionsProgress().records["mission-001"].bestScore).toBe(80);
  });

  it("keeps the best score while accumulating attempts and completions", () => {
    recordMissionResult(result(100));
    const progress = recordMissionResult(result(60,3)), record = progress.records["mission-001"];
    expect(record.bestScore).toBe(100);
    expect(record.attempts).toBe(4);
    expect(record.completions).toBe(2);
    expect(progress.lastPlayedMissionId).toBe("mission-001");
  });

  it("does not modify an accounting workspace key", () => {
    localStorage.setItem("saved-accounting-entries:company:branch:year", "sentinel");
    recordMissionResult(result(100));
    expect(localStorage.getItem("saved-accounting-entries:company:branch:year")).toBe("sentinel");
    expect(localStorage.getItem(MISSIONS_STORAGE_KEY)).toBeTruthy();
  });
});

