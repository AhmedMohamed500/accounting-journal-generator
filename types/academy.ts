export type AcademyLevel = "beginner" | "intermediate" | "advanced";

export interface AcademyEntryLine {
  accountAr: string;
  accountEn: string;
  debit: number;
  credit: number;
}

export interface AcademyExample {
  titleAr: string;
  titleEn: string;
  scenarioAr: string;
  scenarioEn: string;
  lines: AcademyEntryLine[];
  impactAr: string[];
  impactEn: string[];
}

export interface AcademyQuizQuestion {
  questionAr: string;
  questionEn: string;
  choicesAr: string[];
  choicesEn: string[];
  correctIndex: number;
  explanationAr: string;
  explanationEn: string;
}

export interface AcademyLesson {
  slug: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  duration: number;
  objectivesAr: string[];
  objectivesEn: string[];
  ruleAr: string;
  ruleEn: string;
  stepsAr: string[];
  stepsEn: string[];
  mistakesAr: string[];
  mistakesEn: string[];
  example?: AcademyExample;
  quiz: AcademyQuizQuestion[];
}

export interface AcademyModule {
  id: string;
  titleAr: string;
  titleEn: string;
  lessons: AcademyLesson[];
}

export interface AcademyCourse {
  slug: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  level: AcademyLevel;
  accent: "blue" | "green" | "violet" | "orange" | "cyan" | "rose";
  modules: AcademyModule[];
}

export interface AcademyProgress {
  completedLessonIds: string[];
  quizScores: Record<string, number>;
  lastLessonId?: string;
}
