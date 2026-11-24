import { isSameOrigin } from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";
import { resetState } from "@/lib/db";
export const runtime = "nodejs";
export async function POST(req:NextRequest){if(!isSameOrigin(req))return NextResponse.json({error:"Origen no permitido"},{status:403});resetState();return NextResponse.json({ok:true});}
