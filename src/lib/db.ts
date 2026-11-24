import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { lessons } from "@/lib/course";
import type { AppState, LessonStatus } from "@/lib/types";

const storagePath = process.env.PROGRESS_DB_PATH ?? "./data/progreso.sqlite";
const fileName = path.resolve(process.cwd(), storagePath);

type Db = Database.Database;
const globalWithDb = globalThis as unknown as { __academyDb?: Db };
function createDb(): Db {
  mkdirSync(path.dirname(fileName), { recursive: true });
  const db = new Database(fileName);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  db.exec(`
    CREATE TABLE IF NOT EXISTS progress (
      lesson_id TEXT PRIMARY KEY,
      is_read INTEGER NOT NULL DEFAULT 0,
      passed INTEGER NOT NULL DEFAULT 0,
      best_score INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS lab_tasks (
      lesson_id TEXT NOT NULL,
      task_index INTEGER NOT NULL,
      PRIMARY KEY (lesson_id, task_index)
    );
    CREATE TABLE IF NOT EXISTS notes (
      lesson_id TEXT PRIMARY KEY,
      body TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS capstone_tasks (
      task_index INTEGER PRIMARY KEY
    );
    CREATE TABLE IF NOT EXISTS course_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      selections TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // Migración de contenido: las clases 8-26 eran resúmenes en v2.
  // Se conservan notas y lecturas 1-7; se archivan intentos anteriores
  // y se reinicia el estado de las clases rediseñadas para evaluarlas de nuevo.
  const row = db.prepare("SELECT value FROM course_meta WHERE key='course_revision'")
    .get() as {value:string}|undefined;
  if(row?.value !== "3") {
    const ids = Array.from({length:19},(_,i)=>`ruta-chat-${String(i+8).padStart(2,"0")}`);
    const placeholders = ids.map(()=>"?").join(",");
    db.transaction(() => {
      db.exec(`CREATE TABLE IF NOT EXISTS quiz_attempts_legacy AS
        SELECT * FROM quiz_attempts WHERE 0`);
      db.prepare(`INSERT INTO quiz_attempts_legacy
        SELECT * FROM quiz_attempts WHERE lesson_id IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM quiz_attempts WHERE lesson_id IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM lab_tasks WHERE lesson_id IN (${placeholders})`).run(...ids);
      db.prepare(`UPDATE progress SET is_read=0,passed=0,best_score=0,attempts=0
        WHERE lesson_id IN (${placeholders})`).run(...ids);
      db.prepare(`INSERT INTO course_meta(key,value) VALUES('course_revision','3')
        ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run();
    })();
  }
  return db;
}
export const getDb = () => (globalWithDb.__academyDb ??= createDb());

export function getState(): AppState {
  const db = getDb();
  const rows = db.prepare("SELECT lesson_id, is_read, passed, best_score, attempts, updated_at FROM progress").all() as {
    lesson_id: string; is_read:number; passed:number; best_score:number; attempts:number; updated_at:string;
  }[];
  const progress: LessonStatus[] = rows.map((r) => ({
    lessonId:r.lesson_id, read:Boolean(r.is_read), passed:Boolean(r.passed),
    bestScore:r.best_score, attempts:r.attempts, updatedAt:r.updated_at,
  }));
  const notes: Record<string,string> = {};
  for (const row of db.prepare("SELECT lesson_id, body FROM notes").all() as {lesson_id:string;body:string}[]) {
    notes[row.lesson_id] = row.body;
  }
  const labTasks:Record<string,number[]> = {};
  for (const row of db.prepare("SELECT lesson_id, task_index FROM lab_tasks").all() as {lesson_id:string;task_index:number}[]) {
    (labTasks[row.lesson_id] ??= []).push(row.task_index);
  }
  const attempts: AppState["attempts"] = {};
  for (const row of db.prepare("SELECT lesson_id, score, total, created_at FROM quiz_attempts ORDER BY id DESC LIMIT 200").all() as {
    lesson_id:string; score:number; total:number; created_at:string;
  }[]) {
    (attempts[row.lesson_id] ??= []).push({score:row.score,total:row.total,createdAt:row.created_at});
  }
  const capstoneDone = (db.prepare("SELECT task_index FROM capstone_tasks ORDER BY task_index").all() as {task_index:number}[]).map(r=>r.task_index);
  return {progress, notes, labTasks, attempts,capstoneDone};
}
export function setRead(lessonId:string, read:boolean) {
  const db=getDb();
  db.prepare(`INSERT INTO progress (lesson_id,is_read,updated_at) VALUES (?,?,CURRENT_TIMESTAMP)
  ON CONFLICT(lesson_id) DO UPDATE SET is_read=excluded.is_read,updated_at=CURRENT_TIMESTAMP`)
    .run(lessonId,Number(read));
}
export function setLab(lessonId:string, index:number, done:boolean) {
  const db=getDb();
  if(done) db.prepare("INSERT OR IGNORE INTO lab_tasks (lesson_id,task_index) VALUES (?,?)").run(lessonId,index);
  else db.prepare("DELETE FROM lab_tasks WHERE lesson_id=? AND task_index=?").run(lessonId,index);
}
export function setCapstoneTask(index:number, done:boolean) {
  const db=getDb();
  if(done) db.prepare("INSERT OR IGNORE INTO capstone_tasks(task_index) VALUES(?)").run(index);
  else db.prepare("DELETE FROM capstone_tasks WHERE task_index=?").run(index);
}
export function setNote(lessonId:string, note:string) {
  getDb().prepare(`INSERT INTO notes (lesson_id,body,updated_at) VALUES (?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(lesson_id) DO UPDATE SET body=excluded.body,updated_at=CURRENT_TIMESTAMP`).run(lessonId,note);
}
export function saveAttempt(lessonId:string, answers:number[], score:number,total:number) {
  const db=getDb();
  const percentage=Math.round(score/total*100);
  db.transaction(() => {
    db.prepare("INSERT INTO quiz_attempts (lesson_id, score, total, selections) VALUES (?,?,?,?)")
      .run(lessonId,score,total,JSON.stringify(answers));
    db.prepare(`INSERT INTO progress(lesson_id,passed,best_score,attempts,updated_at)
      VALUES(?,?,?,1,CURRENT_TIMESTAMP)
      ON CONFLICT(lesson_id) DO UPDATE SET
        passed=MAX(passed,excluded.passed),
        best_score=MAX(best_score,excluded.best_score),
        attempts=attempts+1,
        updated_at=CURRENT_TIMESTAMP`)
      .run(lessonId,Number(percentage>=67),percentage);
  })();
}
export function resetState(){
  const db=getDb(); db.transaction(() => {
    for (const table of ["quiz_attempts","notes","lab_tasks","progress","capstone_tasks"])
      db.prepare(`DELETE FROM ${table}`).run();
  })();
}
export function importState(input:AppState) {
  const db=getDb();
  db.transaction(() => {
    resetState();
    for(const row of input.progress ?? []) {
      if (!lessons.some(l=>l.id===row.lessonId)) continue;
      db.prepare("INSERT INTO progress(lesson_id,is_read,passed,best_score,attempts) VALUES (?,?,?,?,?)")
        .run(row.lessonId,Number(Boolean(row.read)),Number(Boolean(row.passed)),Math.max(0,Math.min(100,Number(row.bestScore)||0)),Math.max(0,Math.min(10000,Number(row.attempts)||0)));
    }
    for(const [id,note] of Object.entries(input.notes ?? {})) {
      if(lessons.some(l=>l.id===id) && typeof note==="string" && note.length<=20000) setNote(id,note);
    }
    for(const [id,indices] of Object.entries(input.labTasks ?? {})) {
      const lesson=lessons.find(l=>l.id===id); if(!lesson || !Array.isArray(indices)) continue;
      for(const index of indices) if(Number.isInteger(index)&&index>=0&&index<lesson.lab.tasks.length) setLab(id,index,true);
    }
    for(const index of input.capstoneDone ?? []){
      if(Number.isInteger(index) && index>=0 && index<10)setCapstoneTask(index,true);
    }
    // Se restauran estadísticas y notas; el historial de respuestas no se falsifica ni importa.
  })();
}
