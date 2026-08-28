import type { MissionResultRecord, MissionsProgress } from "@/types";

export const MISSIONS_STORAGE_KEY = "finora-training-missions-v1";
export const MISSIONS_PROGRESS_UPDATED = "finora-missions-progress-updated";
const emptyProgress = (): MissionsProgress => ({ schemaVersion: 1, records: {} });

export function loadMissionsProgress(): MissionsProgress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const parsed = JSON.parse(localStorage.getItem(MISSIONS_STORAGE_KEY) || "null") as MissionsProgress | null;
    return parsed?.schemaVersion === 1 && parsed.records ? parsed : emptyProgress();
  } catch { return emptyProgress(); }
}

export function saveMissionsProgress(progress: MissionsProgress) {
  if (typeof window === "undefined") return progress;
  localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent(MISSIONS_PROGRESS_UPDATED, { detail: progress }));
  return progress;
}

export function recordMissionResult(result: MissionResultRecord) {
  const current = loadMissionsProgress(), previous = current.records[result.missionId];
  const next: MissionsProgress = {
    schemaVersion: 1,
    lastPlayedMissionId: result.missionId,
    records: { ...current.records, [result.missionId]: {
      missionId: result.missionId, completed: true, bestScore: Math.max(previous?.bestScore || 0, result.score),
      bestAccuracy: Math.max(previous?.bestAccuracy || 0, result.accuracy), attempts: (previous?.attempts || 0) + result.attempts,
      completions: (previous?.completions || 0) + 1, lastPlayedAt: result.completedAt, lastResult: result,
    } },
  };
  return saveMissionsProgress(next);
}

export function subscribeToMissionsProgress(handler: (progress: MissionsProgress) => void) {
  if (typeof window === "undefined") return () => undefined;
  const listener = (event: Event) => handler((event as CustomEvent<MissionsProgress>).detail || loadMissionsProgress());
  window.addEventListener(MISSIONS_PROGRESS_UPDATED, listener);
  return () => window.removeEventListener(MISSIONS_PROGRESS_UPDATED, listener);
}

