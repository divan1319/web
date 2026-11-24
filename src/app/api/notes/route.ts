import { isSameOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { byId } from "@/lib/course";
import { setNote } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(req:NextRequest){
  if(!isSameOrigin(req))return NextResponse.json({error:"Origen no permitido"},{status:403});
  const body=await req.json().catch(()=>null);
  if(!body||typeof body.lessonId!=="string"||!byId(body.lessonId)||typeof body.note!=="string"||body.note.length>20000)
    return NextResponse.json({error:"Nota inválida"},{status:400});
  setNote(body.lessonId,body.note);
  return NextResponse.json({ok:true});
}
