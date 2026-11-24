import type { NextRequest } from "next/server";
/** Protección básica contra POST cross-origin para esta app monousuario local. No reemplaza autenticación. */
export function isSameOrigin(req:NextRequest):boolean {
  const origin=req.headers.get("origin");
  const host=req.headers.get("host");
  if(!origin) return true; // CLI / clientes no navegador (app bind localhost)
  if(!host) return false;
  try{return new URL(origin).host===host;}catch{return false;}
}
