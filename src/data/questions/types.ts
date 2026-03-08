// CLUES Question Library — Shared types
// Split from questionLibrary.ts for context window efficiency

export interface QuestionItem {
  number: number;
  question: string;
  type: string;
}

export interface QuestionSection {
  title: string;
  questionRange?: string;
  questions: QuestionItem[];
}

export interface QuestionModule {
  moduleId: string;
  moduleName: string;
  fileName?: string;
  structure?: string;
  totalQuestions?: number;
  sections: QuestionSection[];
}

export interface ResponseTypeMeta {
  scale?: string;
  labels?: string[];
  description?: string;
  component: string;
}

export interface QuestionLibraryData {
  _meta: {
    project: string;
    description: string;
    totalModules: number;
    totalQuestions: number;
    responseTypes: Record<string, ResponseTypeMeta>;
    brand?: Record<string, string>;
    moduleStructure?: string;
  };
  modules: QuestionModule[];
}
