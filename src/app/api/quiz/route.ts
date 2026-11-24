import { isSameOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { byId } from "@/lib/course";
import { saveAttempt } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(req:NextRequest){
  if(!isSameOrigin(req))return NextResponse.json({error:"Origen no permitido"},{status:403});
  const body=await req.json().catch(()=>null);
  const lesson=body&&typeof body.lessonId==="string"?byId(body.lessonId):null;
  if(!lesson||!Array.isArray(body.answers)||body.answers.length!==lesson.quiz.length||
    body.answers.some((a:unknown,i:number)=>!Number.isInteger(a)||(a as number)<0||(a as number)>=lesson.quiz[i].options.length))
    return NextResponse.json({error:"Respuestas inválidas"},{status:400});
  const answers=body.answers as number[];
  const results=lesson.quiz.map((q,i)=>({question:q.prompt, selected:answers[i],correct:q.correct,isCorrect:answers[i]===q.correct,why:q.why}));
  const score=results.filter(r=>r.isCorrect).length;
  saveAttempt(lesson.id,answers,score,results.length);
  return NextResponse.json({score,total:results.length,passed:Math.round(score/results.length*100)>=67,results});
}
