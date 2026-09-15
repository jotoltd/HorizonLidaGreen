import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function DELETE(request, { params }) {
  const user = getTokenFromRequest(request);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
