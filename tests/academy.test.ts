import { describe, expect, it } from "vitest";
import { academyCourses, academyLessonCount, getAcademyCourse, getAcademyLesson } from "@/data/academy";

describe("FINORA academy curriculum", () => {
  it("contains a complete, uniquely addressable curriculum", () => {
    expect(academyCourses).toHaveLength(6);
    expect(academyLessonCount).toBe(28);
    expect(new Set(academyCourses.map((course) => course.slug)).size).toBe(academyCourses.length);

    for (const course of academyCourses) {
      const lessons = course.modules.flatMap((module) => module.lessons);
      expect(lessons.length).toBeGreaterThanOrEqual(4);
      expect(new Set(lessons.map((lesson) => lesson.slug)).size).toBe(lessons.length);
      expect(getAcademyCourse(course.slug)).toBe(course);
      for (const lesson of lessons) expect(getAcademyLesson(course.slug, lesson.slug)).toBe(lesson);
    }
  });

  it("gives every lesson practical teaching and a valid quiz", () => {
    for (const lesson of academyCourses.flatMap((course) => course.modules.flatMap((module) => module.lessons))) {
      expect(lesson.ruleAr.length).toBeGreaterThan(20);
      expect(lesson.stepsAr.length).toBeGreaterThanOrEqual(3);
      expect(lesson.objectivesAr.length).toBeGreaterThanOrEqual(3);
      expect(lesson.mistakesAr.length).toBeGreaterThanOrEqual(3);
      expect(lesson.quiz.length).toBeGreaterThan(0);
      for (const question of lesson.quiz) {
        expect(question.choicesAr.length).toBeGreaterThanOrEqual(2);
        expect(question.choicesEn).toHaveLength(question.choicesAr.length);
        expect(question.correctIndex).toBeGreaterThanOrEqual(0);
        expect(question.correctIndex).toBeLessThan(question.choicesAr.length);
      }
    }
  });

  it("keeps all teaching journal examples balanced", () => {
    const examples = academyCourses.flatMap((course) => course.modules.flatMap((module) => module.lessons)).flatMap((lesson) => lesson.example ? [lesson.example] : []);
    expect(examples.length).toBeGreaterThanOrEqual(5);
    for (const example of examples) {
      const debit = example.lines.reduce((sum, line) => sum + line.debit, 0);
      const credit = example.lines.reduce((sum, line) => sum + line.credit, 0);
      expect(debit).toBe(credit);
      expect(example.impactAr.length).toBeGreaterThanOrEqual(2);
    }
  });
});
