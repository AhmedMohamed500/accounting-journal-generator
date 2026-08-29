import type { DetectiveAttemptResult, DetectiveCaseProgress, DetectiveProgress, DetectiveSkill } from "@/types";

export const DETECTIVE_STORAGE_KEY = "finora-training-detective-v1";
export const DETECTIVE_PROGRESS_UPDATED = "finora-detective-progress-updated";
const emptyProgress = (): DetectiveProgress => ({ schemaVersion: 1, records: {}, skills: {} });

export function loadDetectiveProgress(): DetectiveProgress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const parsed = JSON.parse(localStorage.getItem(DETECTIVE_STORAGE_KEY) || "null") as DetectiveProgress | null;
    return parsed?.schemaVersion === 1 && parsed.records && parsed.skills ? parsed : emptyProgress();
  } catch { return emptyProgress(); }
}

export function saveDetectiveProgress(progress: DetectiveProgress) {
  if (typeof window === "undefined") return progress;
  localStorage.setItem(DETECTIVE_STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent(DETECTIVE_PROGRESS_UPDATED, { detail: progress }));
  return progress;
}

export function saveDetectiveDraft(caseId: string, draft: Partial<DetectiveCaseProgress>) {
  const current = loadDetectiveProgress(), previous = current.records[caseId];
  const baseline: DetectiveCaseProgress = { caseId, solved: false, bestScore: 0, attempts: 0, completions: 0, lastPlayedAt: new Date().toISOString(), openedEvidence: [], importantEvidence: [], excludedEvidence: [], evidenceLinks: [], notes: [], hintsUsed: 0 };
  const record: DetectiveCaseProgress = { ...baseline, ...previous, ...draft, caseId, lastPlayedAt: new Date().toISOString() };
  return saveDetectiveProgress({ ...current, lastPlayedCaseId: caseId, records: { ...current.records, [caseId]: record } });
}

export function recordDetectiveResult(result: DetectiveAttemptResult, skills: DetectiveSkill[]) {
  const current = loadDetectiveProgress(), previous = current.records[result.caseId];
  const skillProgress = { ...current.skills };
  skills.forEach((skill) => { skillProgress[skill] = Math.min(100, (skillProgress[skill] || 0) + Math.max(8, Math.round(result.score / 100))); });
  const record: DetectiveCaseProgress = {
    caseId: result.caseId, solved: true, bestScore: Math.max(previous?.bestScore || 0, result.score),
    attempts: (previous?.attempts || 0) + result.attempts, completions: (previous?.completions || 0) + 1,
    lastPlayedAt: result.completedAt, openedEvidence: previous?.openedEvidence || [],
    importantEvidence: previous?.importantEvidence || [], excludedEvidence: previous?.excludedEvidence || [],
    evidenceLinks: previous?.evidenceLinks || [], notes: previous?.notes || [], hintsUsed: result.hintsUsed, lastResult: result,
  };
  return saveDetectiveProgress({ schemaVersion: 1, records: { ...current.records, [result.caseId]: record }, skills: skillProgress, lastPlayedCaseId: result.caseId });
}

export function subscribeToDetectiveProgress(handler: (progress: DetectiveProgress) => void) {
  if (typeof window === "undefined") return () => undefined;
  const listener = (event: Event) => handler((event as CustomEvent<DetectiveProgress>).detail || loadDetectiveProgress());
  window.addEventListener(DETECTIVE_PROGRESS_UPDATED, listener);
  return () => window.removeEventListener(DETECTIVE_PROGRESS_UPDATED, listener);
}
