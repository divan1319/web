export type LessonSection = { heading: string; explanation: string; code?: string; language?: string; insight?: string; file?: string; details?: string[]; snippets?: {label:string;code:string;language:string}[] };
export type QuizQuestion = { id: string; prompt: string; options: string[]; correct: number; why: string };
export type Lesson = {
  id: string; number: number; title: string; module: string; duration: number;
  level: "Inicial" | "Intermedio" | "Avanzado"; lead: string;
  outcomes: string[]; files?: string[]; checkpoint?: string; sections: LessonSection[]; lab: { title: string; tasks: string[]; solution: string; instructions: string };
  quiz: QuizQuestion[]; resources: {label:string;url:string}[];
};
export type LessonStatus = { lessonId:string; read:boolean; passed:boolean; bestScore:number; attempts:number; updatedAt:string|null };
export type AppState = { progress: LessonStatus[]; notes:Record<string,string>; labTasks: Record<string,number[]>; attempts: Record<string,{score:number;total:number;createdAt:string}[]>; capstoneDone: number[] };
