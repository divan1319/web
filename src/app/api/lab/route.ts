import { isSameOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { byId } from "@/lib/course";
import { setLab } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(req:NextRequest){
  if(!isSameOrigin(req))return NextResponse.json({error:"Origen no permitido"},{status:403});
  const body=await req.json().catch(()=>null);
  const lesson=body&&typeof body.lessonId==="string"?byId(body.lessonId):null;
  if(!lesson||!Number.isInteger(body.index)||body.index<0||body.index>=lesson.lab.tasks.length||typeof body.done!=="boolean")
    return NextResponse.json({error:"Tarea inválida"},{status:400});
  setLab(lesson.id,body.index,body.done);
  return NextResponse.json({ok:true});
}
