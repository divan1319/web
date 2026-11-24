import raw from "@/data/curso_chat.json";
import type { Lesson } from "./types";

export const lessons = raw.lessons as Lesson[];
export const modules = raw.modules as string[];
export const capstone = raw.capstone as {name:string;description:string;acceptance:string[];deliverables:string[]};
export const byId = (id:string) => lessons.find((item) => item.id === id);
export const totalQuestions = lessons.reduce((count,l) => count + l.quiz.length, 0);
