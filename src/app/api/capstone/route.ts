import { isSameOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { capstone } from "@/lib/course";
import { setCapstoneTask } from "@/lib/db";
export const runtime="nodejs";
export async function POST(req:NextRequest){
  if(!isSameOrigin(req))return NextResponse.json({error:"Origen no permitido"},{status:403});
  const body=await req.json().catch(()=>null);
  if(!body||!Number.isInteger(body.index)||body.index<0||body.index>=capstone.acceptance.length||typeof body.done!=="boolean")
    return NextResponse.json({error:"Criterio inválido"},{status:400});
  setCapstoneTask(body.index,body.done);
  return NextResponse.json({ok:true});
}
