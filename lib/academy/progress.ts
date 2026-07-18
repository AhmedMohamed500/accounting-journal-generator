import type { AcademyProgress } from "@/types";

const KEY = "finora-academy-progress";
const empty: AcademyProgress = { completedLessonIds: [], quizScores: {} };

export function loadAcademyProgress(): AcademyProgress {
  if (typeof window === "undefined") return empty;
  try { return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return empty; }
}

export function saveAcademyProgress(progress: AcademyProgress) {
  localStorage.setItem(KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent("academy-progress-updated", { detail: progress }));
}

export function completeAcademyLesson(lessonId: string, score?: number) {
  const current = loadAcademyProgress(), completedLessonIds = current.completedLessonIds.includes(lessonId) ? current.completedLessonIds : [...current.completedLessonIds, lessonId];
  const quizScores = score === undefined ? current.quizScores : { ...current.quizScores, [lessonId]: score };
  const next = { completedLessonIds, quizScores, lastLessonId: lessonId };
  saveAcademyProgress(next); return next;
}
