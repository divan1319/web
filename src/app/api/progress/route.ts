import { isSameOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { byId } from "@/lib/course";
import { setRead } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(req:NextRequest){
  if(!isSameOrigin(req))return NextResponse.json({error:"Origen no permitido"},{status:403});
  const body=await req.json().catch(()=>null);
  if(!body||typeof body.lessonId!=="string"||!byId(body.lessonId)||typeof body.read!=="boolean")
    return NextResponse.json({error:"Parámetros inválidos"},{status:400});
  setRead(body.lessonId,body.read);
  return NextResponse.json({ok:true});
}
