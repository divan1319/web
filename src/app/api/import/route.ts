import { isSameOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { importState } from "@/lib/db";
import type { AppState } from "@/lib/types";
export const runtime = "nodejs";
export async function POST(req:NextRequest){
  if(!isSameOrigin(req))return NextResponse.json({error:"Origen no permitido"},{status:403});
  const body=await req.json().catch(()=>null);
  if(!body||body.version!==1||!body.state||!Array.isArray(body.state.progress)||typeof body.state.notes!=="object"||body.state.notes===null)
    return NextResponse.json({error:"Archivo de progreso incompatible"},{status:400});
  if(JSON.stringify(body).length>300000)
    return NextResponse.json({error:"Archivo demasiado grande"},{status:413});
  importState(body.state as AppState);
  return NextResponse.json({ok:true});
}
