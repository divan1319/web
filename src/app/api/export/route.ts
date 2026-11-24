import { NextResponse } from "next/server";
import { getState } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(){
  return new NextResponse(JSON.stringify({version:1,exportedAt:new Date().toISOString(),state:getState()},null,2),{
    headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":"attachment; filename=dotnet-atlas-progreso.json","Cache-Control":"no-store"}
  });
}
